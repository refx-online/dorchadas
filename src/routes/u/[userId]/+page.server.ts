import { getClan, getPlayer } from '$lib/api.js';
import { sanitizeHtml } from '$lib/html';
import { isNumber } from '$lib/stringUtil.js';
import { parse } from 'marked';
import { parseBBCodeToHtml } from '$lib/bbcode';
import { getMySQLDatabase } from '../../../hooks.server';
import { getUserFromSession } from '$lib/user';
import { 
    getUserRelationships, 
    getPlayCountResults, 
    addFriend, 
    removeFriend,
    getOldUsername, 
    getUsersLog,
    batchFetchTitles
} from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ params, cookies }) {
	const requestedUserId = params.userId; // now can be name too!
    const sessionToken = cookies.get('sessionToken');

	const user = await getPlayer(requestedUserId, 'all');
    if (!user || !user.player) return {};

    const ourUser = await getUserFromSession(sessionToken);
	const userpageData = user?.player?.info.userpage_content ?? '';
    const parsedBBCode = parseBBCodeToHtml(userpageData);
    
    const sanitizedUserPage = sanitizeHtml(parsedBBCode);
    
    const parsedUserPage = await parse(sanitizedUserPage, {
        async: true,
        gfm: true
    });

	const clan = user?.player?.info.clan_id ? await getClan(user.player.info.clan_id) : undefined;

    const playCountGraph = await getPlayCountResults(user?.player?.info.id.toString()); // deadass why the fuck do i put the param to str instead of num
    const relationships = await getUserRelationships(user?.player?.info.id.toString(), ourUser);
    const oldUsernames = await getOldUsername(user?.player?.info.id, user?.player?.info.name);
    const usersLog = await getUsersLog(user?.player?.info.id);
    const logTitles = await batchFetchTitles(usersLog); // map / score titles

    const ourPriv = ourUser?.priv;

	return {
		user: user?.player,
		clan: clan,
		userpage: parsedUserPage,
        playCountGraph,
        relationships: relationships,
        oldUsernames,
        ourPriv,
        usersLog,
        logTitles
	};
}

export const actions = {
    updateUserpage: async ({ request, params, locals, cookies }) => {
        // i just realized why didnt i just use session
        // too bad
        const session = await getUserFromSession(cookies.get('sessionToken'));
        if (!session) throw redirect(302, '/signin')

        const data = await request.formData();
        const userpageContent = data.get('userpage')?.toString() ?? '';

        if (!isNumber(params.userId) || session.id != params.userId) {
            throw redirect(302, '/signin');
        }

        try {
            const mysqlDatabase = await getMySQLDatabase();

            await mysqlDatabase('users')
                .where('id', parseInt(params.userId))
                .update({ userpage_content: userpageContent });

            return { success: true };
        } catch (error) {
            console.error('failed to update userpage', error);
            throw fail(500, { error: 'Something went wrong.' });
        }
    },
    relationship: async ({ request, cookies }) => {
        const userSession = await getUserFromSession(cookies.get('sessionToken'));
        if (!userSession) throw redirect(302, '/signin');

        const userID = userSession.id;
        const data = await request.formData();
        const friendID = data.get('friendID');
        const relationshipStatus = data.get('relationshipStatus');

        if (userID === friendID) { 
            throw fail(302, { error: "you can't friend yourself :3c"});
        }

        try {
            if (relationshipStatus === 'mutual' || relationshipStatus === 'known') {
                // unfollow
                await removeFriend(userID, friendID);
            } else {
                // follow
                await addFriend(userID, friendID);
            }
        } catch (error) {
            console.error('failed to update relationship', error)
            throw fail(500, { error: 'Something went wrong.'} )
        }
    },

    // profile comments
    addComment: async ({ request, cookies }) => {
        const session = await getUserFromSession(cookies.get('sessionToken'));
        if (!session) throw redirect(302, '/signin');

        const data = await request.formData();
        const comment = data.get('comment')?.toString();
        const userId = data.get('userId')?.toString();

        if (!comment || !userId) {
            return fail(400, { error: 'Missing required fields' });
        }

        try {
            const mysqlDatabase = await getMySQLDatabase();

            await mysqlDatabase('profile_comments').insert({
                user_id: parseInt(userId),
                from_id: session.id,
                comment: comment
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to add comment', error);
            return fail(500, { error: 'Failed to add comment' });
        }
    },

    editComment: async ({ request, cookies }) => {
        const session = await getUserFromSession(cookies.get('sessionToken'));
        if (!session) throw redirect(302, '/signin');

        const data = await request.formData();
        const commentId = data.get('commentId')?.toString();
        const comment = data.get('comment')?.toString();

        if (!commentId || !comment) {
            return fail(400, { error: 'Missing required fields' });
        }

        try {
            const mysqlDatabase = await getMySQLDatabase();
            
            // verify comment ownership
            const existingComment = await mysqlDatabase('profile_comments')
                .where('id', parseInt(commentId))
                .first();

            if (!existingComment || existingComment.from_id !== session.id) {
                return fail(403, { error: 'Unauthorized' });
            }

            await mysqlDatabase('profile_comments')
                .where('id', parseInt(commentId))
                .update({
                    comment: comment,
                    updated_at: mysqlDatabase.fn.now()
                });

            return { success: true };
        } catch (error) {
            console.error('Failed to edit comment', error);
            return fail(500, { error: 'Failed to edit comment' });
        }
    },

    deleteComment: async ({ request, cookies }) => {
        const session = await getUserFromSession(cookies.get('sessionToken'));
        if (!session) throw redirect(302, '/signin');

        const data = await request.formData();
        const commentId = data.get('commentId')?.toString();

        if (!commentId) {
            return fail(400, { error: 'Missing comment ID' });
        }

        try {
            const mysqlDatabase = await getMySQLDatabase();
            
            // verify comment ownership
            const comment = await mysqlDatabase('profile_comments')
                .where('id', parseInt(commentId))
                .first();

            if (!comment || comment.from_id !== session.id) {
                return fail(403, { error: 'Unauthorized' });
            }

            await mysqlDatabase('profile_comments')
                .where('id', parseInt(commentId))
                .delete();

            return { success: true };
        } catch (error) {
            console.error('Failed to delete comment', error);
            return fail(500, { error: 'Failed to delete comment' });
        }
    }
}