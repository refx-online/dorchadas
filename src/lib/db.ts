import { getMySQLDatabase } from '../hooks.server';
import type { DBClan, TopScore, UserRelationship, UsersLog } from './types';

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
		const scores = await mysqlDB.raw(
			`
            SELECT s.status, s.id as scoreid, s.userid, s.pp, s.mods, s.grade,
                   m.set_id, m.title, m.version, m.artist,
                   u.country, u.name as username,
                   m.id as map_id,
                   ls.mods_json
            FROM scores s
            LEFT JOIN users u ON u.id = s.userid
            LEFT JOIN maps m ON m.md5 = s.map_md5
            LEFT JOIN lazer_scores ls ON ls.score_id = s.id
            WHERE s.mode = ?
            AND u.priv & 1
            AND m.status IN (2, 3)
            AND s.status = 2
            ORDER BY s.pp DESC
            LIMIT ? OFFSET ?
        `,
			[opts.mode, limit, offset]
		);

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

		const countResult = await mysqlDB.raw(
			`
            SELECT COUNT(*) as count
            FROM scores s
            LEFT JOIN users u ON u.id = s.userid
            LEFT JOIN maps m ON m.md5 = s.map_md5
            WHERE s.mode = ?
            AND u.priv & 1
            AND m.status IN (2, 3)
            AND s.status = 2
        `,
			[mode]
		);

		return countResult[0][0].count;
	} catch (e) {
		console.error('Error fetching top scores count:', e);
		return 0;
	}
};

export const getPlayCountResults = async (
	requestedUserId: string
): Promise<Record<string, number>> => {
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

export const getUserRelationships = async (
	requestedUserId: string,
	ourUser: any
): Promise<UserRelationship> => {
	let relationships: UserRelationship = {
		followers: 0,
		relationshipStatus: 'none'
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
			[ourUser?.id, ourUser?.id, parseInt(requestedUserId), parseInt(requestedUserId), ourUser?.id]
		);

		if (statusResult[0].length > 0) {
			relationships.relationshipStatus = statusResult[0][0].status;
		}
	}

	return relationships;
};

export const getUsersLog = async (userId: number): Promise<UsersLog[]> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return [];

	const logs = await mysqlDB<UsersLog>('users_log')
		.where('user_id', userId)
		.orderBy('timestamp', 'desc')
		.limit(10);

	if (!logs) return [];

	return logs;
};

export const pinScore = async (scoreID: number, isPinned: boolean): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB('scores')
		.update('pinned', isPinned ? 0 : 1) // ?????????????????????????????????????????
		.where('id', scoreID);
};

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

	await mysqlDB('relationships').insert({
		user1: userID,
		user2: friendID,
		type: 'friend'
	});
};

export const removeFriend = async (userID: number, friendID: number): Promise<void> => {
	if (userID === friendID) return;

	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB('relationships').where('user1', userID).andWhere('user2', friendID).del();
};

export const getOldUsername = async (userID: number, currUsername?: string): Promise<string> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return '';

	const old_usernames = await mysqlDB('username_log')
		.select('old_username')
		.where('user_id', userID);

	if (!old_usernames || old_usernames.length === 0) return '';

	// remove duplicates
	// i did an oopsies in the settings
	const u = Array.from(new Set(old_usernames.map((entry) => entry.old_username)));

	// return as a single string
	const usernames = u.filter((username) => username !== currUsername).join(', ');

	return usernames;
};

export const batchFetchTitles = async (logs: UsersLog[]): Promise<Record<number, string>> => {
	const results: Record<number, string> = {};

	try {
		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) return results;

		const scoreLogIds = logs
			.filter((log) => log.type === 'rank' || log.type === 'lost')
			.map((log) => log.type_id);

		const mapLogIds = logs
			.filter((log) => log.type === 'submit' || log.type === 'update')
			.map((log) => log.type_id);

		if (scoreLogIds.length > 0) {
			const scoreResults = await mysqlDB('scores')
				.select('id', 'map_md5')
				.whereIn('id', scoreLogIds);

			const mapMd5s = scoreResults.map((score) => score.map_md5);

			if (mapMd5s.length > 0) {
				const mapResults = await mysqlDB('maps')
					.select('md5', 'artist', 'title', 'version')
					.whereIn('md5', mapMd5s);

				const mapLookup = mapResults.reduce(
					(acc, map) => {
						acc[map.md5] = map;
						return acc;
					},
					{} as Record<string, any>
				);

				scoreResults.forEach((score) => {
					const mapInfo = mapLookup[score.map_md5];
					if (mapInfo) {
						results[score.id] = `${mapInfo.artist} - ${mapInfo.title} [${mapInfo.version}]`;
					}
				});
			}
		}

		if (mapLogIds.length > 0) {
			const mapResults = await mysqlDB('maps')
				.select('id', 'artist', 'title')
				.whereIn('id', mapLogIds);

			mapResults.forEach((map) => {
				results[map.id] = `${map.artist} - ${map.title}`;
			});
		}
	} catch (error) {
		console.error('Failed to batch fetch titles:', error);
	}

	return results;
};

export const createClanInvite = async (clanId: number, userId: number): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB('clan_invites').insert({
		clan_id: clanId,
		user_id: userId,
		status: 'pending'
	});
};

export const getUserInvites = async (userId: number): Promise<any[]> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return [];

	return await mysqlDB('clan_invites')
		.select(
			'clan_invites.id',
			'clans.name as clan_name',
			'clans.tag as clan_tag',
			'clan_invites.clan_id'
		)
		.join('clans', 'clan_invites.clan_id', 'clans.id')
		.where('clan_invites.user_id', userId)
		.andWhere('clan_invites.status', 'pending');
};

export const getClanInvites = async (clanId: number): Promise<any[]> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return [];

	return await mysqlDB('clan_invites')
		.select(
			'clan_invites.id',
			'users.name as username',
			'clan_invites.user_id',
			'clan_invites.status'
		)
		.join('users', 'clan_invites.user_id', 'users.id')
		.where('clan_invites.clan_id', clanId)
		.andWhere('clan_invites.status', 'pending');
};

export const respondToInvite = async (
	inviteId: number,
	userId: number,
	status: 'accepted' | 'rejected'
): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	const invite = await mysqlDB('clan_invites')
		.where('id', inviteId)
		.andWhere('user_id', userId)
		.first();

	if (!invite) return;

	await mysqlDB.transaction(async (trx) => {
		await trx('clan_invites').where('id', inviteId).update({ status });

		if (status === 'accepted') {
			await trx('users').where('id', userId).update({ clan_id: invite.clan_id });
			// Cancel all other pending invites and join requests for this user
			await trx('clan_invites')
				.where('user_id', userId)
				.whereIn('status', ['pending', 'request_pending'])
				.update({ status: 'rejected' });
		}
	});
};

export const leaveClan = async (userId: number): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB('users').where('id', userId).update({ clan_id: 0 });
};

export const deleteClan = async (clanId: number): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB.transaction(async (trx) => {
		await trx('users').where('clan_id', clanId).update({ clan_id: 0 });
		await trx('clan_invites').where('clan_id', clanId).del();
		await trx('clans').where('id', clanId).del();
	});
};

export const cancelInvite = async (inviteId: number, clanId: number): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB('clan_invites').where('id', inviteId).andWhere('clan_id', clanId).del();
};

export const createClan = async (name: string, tag: string, ownerId: number): Promise<number> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return 0;

	return await mysqlDB.transaction(async (trx) => {
		const [clanId] = await trx('clans').insert({
			name,
			tag,
			owner: ownerId
		});

		await trx('users').where('id', ownerId).update({ clan_id: clanId });

		return clanId;
	});
};

export const requestToJoinClan = async (clanId: number, userId: number): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	await mysqlDB('clan_invites').insert({
		clan_id: clanId,
		user_id: userId,
		status: 'request_pending'
	});
};

export const getClanJoinRequests = async (clanId: number): Promise<any[]> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return [];

	return await mysqlDB('clan_invites')
		.select(
			'clan_invites.id',
			'users.name as username',
			'clan_invites.user_id',
			'clan_invites.status'
		)
		.join('users', 'clan_invites.user_id', 'users.id')
		.where('clan_invites.clan_id', clanId)
		.andWhere('clan_invites.status', 'request_pending');
};

export const respondToJoinRequest = async (
	requestId: number,
	clanId: number,
	status: 'accepted' | 'rejected'
): Promise<void> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return;

	const request = await mysqlDB('clan_invites')
		.where('id', requestId)
		.andWhere('clan_id', clanId)
		.andWhere('status', 'request_pending')
		.first();

	if (!request) return;

	await mysqlDB.transaction(async (trx) => {
		const finalStatus = status === 'accepted' ? 'accepted' : 'rejected';
		await trx('clan_invites').where('id', requestId).update({ status: finalStatus });

		if (status === 'accepted') {
			await trx('users').where('id', request.user_id).update({ clan_id: clanId });
			// Cancel all other pending invites and join requests for this user
			await trx('clan_invites')
				.where('user_id', request.user_id)
				.whereIn('status', ['pending', 'request_pending'])
				.update({ status: 'rejected' });
		}
	});
};

export const getUserJoinRequests = async (userId: number): Promise<any[]> => {
	const mysqlDB = await getMySQLDatabase();
	if (!mysqlDB) return [];

	return await mysqlDB('clan_invites')
		.select(
			'clan_invites.id',
			'clans.name as clan_name',
			'clans.tag as clan_tag',
			'clan_invites.clan_id'
		)
		.join('clans', 'clan_invites.clan_id', 'clans.id')
		.where('clan_invites.user_id', userId)
		.andWhere('clan_invites.status', 'request_pending');
};
