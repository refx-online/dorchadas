import type { PageServerLoad } from '../$types';
import { getMySQLDatabase } from '../../hooks.server';
import { error, redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';

export const load: PageServerLoad = async ({ cookies }) => {
    const session = await getUserFromSession(cookies.get('sessionToken') ?? '');
    if (!session) throw redirect(302, '/signin')

    const mysqlDB = await getMySQLDatabase();
    if (!mysqlDB) {
        throw error(500, 'Database connection failed');
    }

    // maybe i could use getRelationship from db?
    // this is just the easy way
    const [followerResults, friendResults] = await Promise.all([
        // followers
        mysqlDB.raw(`
            SELECT DISTINCT
                u.id,
                u.name AS username,
                u.country
            FROM relationships r
            JOIN users u ON u.id = r.user1
            WHERE r.user2 = ?
        `, [session.id]),

        // friends
        mysqlDB.raw(`
            SELECT DISTINCT
                u.id,
                u.name AS username,
                u.country
            FROM users u
            WHERE u.id IN (
                SELECT r.user2
                FROM relationships r
                WHERE r.user1 = ?

                UNION

                SELECT r1.user2
                FROM relationships r1
                JOIN relationships r2 ON r1.user1 = r2.user2
                    AND r1.user2 = r2.user1
                WHERE r1.user1 = ?
            )
        `, [session.id, session.id])
    ]);

    return {
        userId: session.id,
        friends: friendResults[0].map(friend => ({
            id: friend.id,
            username: friend.username,
            country: friend.country
        })),
        followers: followerResults[0].map(follower => ({
            id: follower.id,
            username: follower.username,
            country: follower.country
        }))
    };
};