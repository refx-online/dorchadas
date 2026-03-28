import { fetchClan, fetchPlayer, fetchPPProfileHistory } from '$lib/api';
import { sanitizeHtml } from '$lib/html';
import { isNumber } from '$lib/string-util';
import { parse } from 'marked';
import { parseBBCodeToHtml } from '$lib/bbcode';
import { getUserFromSession } from '$lib/user';
import {
	fetchUserRelationships,
	fetchPlayCountResults,
	createFriendship,
	deleteFriendship,
	fetchOldUsernames,
	fetchUsersLog,
	fetchLogTitlesBatch,
	updateUserpage,
	createComment,
	fetchComment,
	updateComment,
	deleteComment
} from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ params, cookies }) {
	const requestedUser = params.userId; // now can be name too!
	const sessionToken = cookies.get('sessionToken');

	const playerResult = await fetchPlayer(requestedUser, 'all');
	if (!playerResult.ok || !playerResult.value.player) return {};

	const user = playerResult.value;
	const ourUser = await getUserFromSession(sessionToken);
	const userpageData = user.player?.info.userpage_content ?? '';
	const parsedBBCode = parseBBCodeToHtml(userpageData);

	const sanitizedUserPage = sanitizeHtml(parsedBBCode);

	const parsedUserPage = await parse(sanitizedUserPage, {
		async: true,
		gfm: true
	});

	const clanResult =
		user.player && user.player.info.clan_id ? await fetchClan(user.player.info.clan_id) : undefined;
	const clan = clanResult?.ok ? clanResult.value : undefined;

	const playCountResult = await fetchPlayCountResults(user.player?.info.id.toString() || '');
	const playCountGraph = playCountResult.ok ? playCountResult.value : {};

	const relationshipResult = await fetchUserRelationships(
		user.player?.info.id.toString() || '',
		ourUser
	);
	const relationships = relationshipResult.ok
		? relationshipResult.value
		: { followers: 0, relationshipStatus: 'none' };

	const oldUsernamesResult = await fetchOldUsernames(
		user.player?.info.id || 0,
		user.player?.info.name || ''
	);
	const oldUsernames = oldUsernamesResult.ok ? oldUsernamesResult.value : '';

	const usersLogResult = await fetchUsersLog(user.player?.info.id || 0);
	const usersLog = usersLogResult.ok ? usersLogResult.value : [];

	const logTitlesResult = await fetchLogTitlesBatch(usersLog);
	const logTitles = logTitlesResult.ok ? logTitlesResult.value : {};

	const ppHistoryData = await Promise.all(
		Array.from({ length: 21 }, async (_, i) => {
			if (!user.player) return null;
			const res = await fetchPPProfileHistory('pp', user.player.info.id, i);
			return res.ok ? res.value : null;
		})
	);

	const ourPriv = ourUser?.priv;

	return {
		user: user.player,
		clan,
		userpage: parsedUserPage,
		playCountGraph,
		relationships,
		oldUsernames,
		ourPriv,
		usersLog,
		logTitles,
		ppHistoryData
	};
}

export const actions = {
	updateUserpage: async ({ request, params, cookies }) => {
		const session = await getUserFromSession(cookies.get('sessionToken'));
		if (!session) throw redirect(302, '/signin');

		const data = await request.formData();
		const userpageContent = data.get('userpage')?.toString() ?? '';

		if (!isNumber(params.userId) || session.id != parseInt(params.userId)) {
			throw redirect(302, '/signin');
		}

		const result = await updateUserpage(session.id, userpageContent);
		if (!result.ok) {
			return fail(500, { error: 'Failed to update userpage' });
		}

		return { success: true };
	},
	relationship: async ({ request, cookies }) => {
		const userSession = await getUserFromSession(cookies.get('sessionToken'));
		if (!userSession) throw redirect(302, '/signin');

		const userID = userSession.id;
		const data = await request.formData();
		const friendID = data.get('friendID')?.toString();

		if (!friendID) {
			return fail(400, { error: 'Missing required fields' });
		}

		const relationshipStatus = data.get('relationshipStatus');

		if (userID === parseInt(friendID)) {
			return fail(400, { error: "you can't friend yourself :3c" });
		}

		let result;
		if (relationshipStatus === 'mutual' || relationshipStatus === 'known') {
			result = await deleteFriendship(userID, parseInt(friendID));
		} else {
			result = await createFriendship(userID, parseInt(friendID));
		}

		if (!result.ok) {
			return fail(500, { error: 'Something went wrong.' });
		}
		return { success: true };
	},

	addComment: async ({ request, cookies }) => {
		const session = await getUserFromSession(cookies.get('sessionToken'));
		if (!session) throw redirect(302, '/signin');

		const data = await request.formData();
		const comment = data.get('comment')?.toString();
		const userId = data.get('userId')?.toString();

		if (!comment || !userId) {
			return fail(400, { error: 'Missing required fields' });
		}

		const result = await createComment(parseInt(userId), session.id, comment);
		if (!result.ok) {
			return fail(500, { error: 'Failed to add comment' });
		}

		return { success: true };
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

		const commentResult = await fetchComment(parseInt(commentId));
		if (!commentResult.ok || !commentResult.value || commentResult.value.from_id !== session.id) {
			return fail(403, { error: 'Unauthorized' });
		}

		const result = await updateComment(parseInt(commentId), comment);
		if (!result.ok) {
			return fail(500, { error: 'Failed to edit comment' });
		}

		return { success: true };
	},

	deleteComment: async ({ request, cookies }) => {
		const session = await getUserFromSession(cookies.get('sessionToken'));
		if (!session) throw redirect(302, '/signin');

		const data = await request.formData();
		const commentId = data.get('commentId')?.toString();

		if (!commentId) {
			return fail(400, { error: 'Missing comment ID' });
		}

		const commentResult = await fetchComment(parseInt(commentId));
		if (!commentResult.ok || !commentResult.value || commentResult.value.from_id !== session.id) {
			return fail(403, { error: 'Unauthorized' });
		}

		const result = await deleteComment(parseInt(commentId));
		if (!result.ok) {
			return fail(500, { error: 'Failed to delete comment' });
		}

		return { success: true };
	}
};
