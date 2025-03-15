import type { User } from 'svelte-feathers';
import { getMySQLDatabase } from '../hooks.server';
import type { DBClan, TopScore, UserRelationship } from './types';

export const getClans = async (opts: {
	mode: number;
	limit: number;
	offset: number;
}): Promise<DBClan[] | undefined> => {
	try {
		//NOTE: PLEASE FIX THIS LATER THIS IS BS naw bru you fix it yourself :trole:
		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) return [];
		if (opts.limit < 1 || opts.offset < 0) return [];
		if (opts.limit > 100) opts.limit = 100;

		const clans = await mysqlDB('clans')
			.select('clans.id', 'clans.name', 'clans.tag', 'clans.owner')
			.select(mysqlDB.raw('ROUND(SUM(stats.pp)) as total_pp'))
			.count('users.id as users')
			.join('users', 'clans.id', 'users.clan_id')
			.join('stats', 'users.id', 'stats.id')
			.where('stats.mode', opts.mode)
			.groupBy('clans.id', 'clans.name')
			.orderBy('total_pp', 'desc')
			.limit(opts.limit)
			.offset(opts.offset);
		return clans.map((c) => {
			c.total_pp = parseFloat(c.total_pp as string);
			return c;
		}) as DBClan[];
	} catch (e) {
		console.log(e);
		return undefined;
	}
};

export const getTopScores = async (opts: {
    mode: number;
    limit?: number;
    offset?: number;
}): Promise<TopScore[] | undefined> => {
    try {
        const mysqlDB = await getMySQLDatabase();
        if (!mysqlDB) return [];

        const limit = opts.limit ?? 45;
        const offset = opts.offset ?? 0;
		// me when raw
        const scores = await mysqlDB.raw(`
            SELECT s.status, s.id as scoreid, s.userid, s.pp, s.mods, s.grade, 
                   m.set_id, m.title, m.version, m.artist, 
                   u.country, u.name as username,
                   m.id as map_id
            FROM scores s 
            LEFT JOIN users u ON u.id = s.userid 
            LEFT JOIN maps m ON m.md5 = s.map_md5 
            WHERE s.mode = ? 
            AND u.priv & 1 
            AND m.status IN (2, 3) 
            AND s.status = 2 
            ORDER BY s.pp DESC 
            LIMIT ? OFFSET ?
        `, [opts.mode, limit, offset]);

        return scores[0] as TopScore[];
    } catch (e) {
        console.error('Error fetching top scores:', e);
        return undefined;
    }
};

export const getTopScoresCount = async (mode: number): Promise<number> => {
    try {
        const mysqlDB = await getMySQLDatabase();
        if (!mysqlDB) return 0;

        const countResult = await mysqlDB.raw(`
            SELECT COUNT(*) as count
            FROM scores s 
            LEFT JOIN users u ON u.id = s.userid 
            LEFT JOIN maps m ON m.md5 = s.map_md5 
            WHERE s.mode = ? 
            AND u.priv & 1 
            AND m.status IN (2, 3) 
            AND s.status = 2
        `, [mode]);

        return countResult[0][0].count;
    } catch (e) {
        console.error('Error fetching top scores count:', e);
        return 0;
    }
};

export const getPlayCountResults = async (requestedUserId: string): Promise<Record<string, number>> => {
    try {
        const mysqlDB = await getMySQLDatabase();
        if (!mysqlDB) return {};

        // https://github.com/osu-NoLimits/Shiina-Web/blob/33926947f5420cf2429cedd66639462d4338f62e/src/main/java/dev/osunolimits/routes/get/User.java#L110
        // Thanks marc
        const playCountResults = await mysqlDB.raw(
            `WITH RECURSIVE month_list AS ( 
                SELECT 
                    DATE_FORMAT(DATE_SUB(MIN(play_time), INTERVAL 1 MONTH), '%Y-%m-01') AS month,
                    DATE_FORMAT(DATE_SUB(MIN(play_time), INTERVAL 1 MONTH), '%M') AS month_name
                FROM scores 
                WHERE userid = ? 
                UNION ALL 
                SELECT 
                    DATE_ADD(month, INTERVAL 1 MONTH),
                    DATE_FORMAT(DATE_ADD(month, INTERVAL 1 MONTH), '%M')
                FROM month_list 
                WHERE month < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') 
            ) 
            SELECT 
                CONCAT(DATE_FORMAT(ml.month, '%Y'), ' ', ml.month_name) AS month, 
                COALESCE(COUNT(s.play_time), 0) AS play_count 
            FROM month_list ml 
            LEFT JOIN scores s ON DATE_FORMAT(s.play_time, '%Y-%m') = DATE_FORMAT(ml.month, '%Y-%m') 
                AND s.userid = ? 
            GROUP BY ml.month, ml.month_name
            ORDER BY ml.month ASC`,
            [requestedUserId, requestedUserId]
        );
        
        const playCountGraph: Record<string, number> = {};
        playCountResults[0].forEach((row: any) => {
            playCountGraph[row.month] = row.play_count;
        });
        
        return playCountGraph;
    } catch (error) {
        console.error('failed to retrieve play count graph', error);
        return {};
    }
};

export const getUserRelationships = async (requestedUserId: string, ourUser: any): Promise<UserRelationship> => {
    let relationships: UserRelationship = {
        followers: 0,
        relationshipStatus: 'none',
    };

    const mysqlDB = await getMySQLDatabase();
    if (!mysqlDB) return relationships;

    const followerResult = await mysqlDB('relationships')
        .count('* as followers')
        .where('user2', requestedUserId)
        .andWhere('user1', '!=', requestedUserId)
        .first();

    relationships.followers = Number(followerResult?.followers ?? 0);

    // also thanks again marc im copying ur logic again
    if (ourUser?.id) {
        const statusResult = await mysqlDB.raw(
            `SELECT 
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM relationships r2 
                        WHERE r2.user1 = r.user2 AND r2.user2 = r.user1
                    ) THEN 'mutual'
                    WHEN r.user1 = ? THEN 'known'
                    ELSE 'follower' 
                END AS status
            FROM relationships r
            WHERE 
                (r.user1 = ? AND r.user2 = ?) OR 
                (r.user1 = ? AND r.user2 = ?)
            LIMIT 1`,
            [
                ourUser?.id, 
                ourUser?.id, 
                parseInt(requestedUserId), 
                parseInt(requestedUserId), 
                ourUser?.id
            ]
        );

        if (statusResult[0].length > 0) {
            relationships.relationshipStatus = statusResult[0][0].status;
        }
    }

    return relationships;
};

export const pinScore = async (scoreID: number, isPinned: boolean): Promise<void> => {
    const mysqlDB = await getMySQLDatabase();
    if (!mysqlDB) return;

    await mysqlDB('scores')
        .update('pinned', isPinned ? 0 : 1) // ?????????????????????????????????????????
        .where('id', scoreID)
}

export const addFriend = async (userID: number, friendID: number): Promise<void> => {
    // we dont want to get silly
    if (userID === friendID) return;

    const mysqlDB = await getMySQLDatabase();
    if (!mysqlDB) return;

    // to check if users already friends, return if is
    // its already handled in the serverside but just incase
    const isMutual = await mysqlDB('relationships')
        .select('type')
        .where('user1', userID)
        .andWhere('user2', friendID)
        .first();

    if (isMutual) return;

    await mysqlDB('relationships')
        .insert({
            user1: userID,
            user2: friendID,
            type: 'friend'
        });
};

export const removeFriend = async (userID: number, friendID: number): Promise<void> => {
    if (userID === friendID) return;
    
    const mysqlDB = await getMySQLDatabase();
    if (!mysqlDB) return;

    await mysqlDB('relationships')
        .where('user1', userID)
        .andWhere('user2', friendID)
        .del();
};

export const getOldUsername = async (userID: number, currUsername?: string): Promise<string> => {
    const mysqlDB = await getMySQLDatabase();
    if (!mysqlDB) return "";

    const old_usernames = await mysqlDB('username_log')
        .select('old_username')
        .where('user_id', userID);

    if (!old_usernames || old_usernames.length === 0) return "";

    // remove duplicates
    // i did an oopsies in the settings
    const u = Array.from(
        new Set(old_usernames.map((entry) => entry.old_username))
    );

    // return as a single string
    const usernames = u
        .filter((username) => username !== currUsername)
        .join(", ");

    return usernames;
};
