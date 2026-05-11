import { getMySQLDatabase } from '$lib/server/connections';
import type { DBClan, TopScore, UserRelationship, UsersLog } from './types';
import { ok, err, type Result, DatabaseError } from './result';
import { logger } from './logger';

type MySQLDatabase = NonNullable<Awaited<ReturnType<typeof getMySQLDatabase>>>;

const withDatabaseResult = async <T>(
	errorMessage: string,
	operation: (mysqlDB: MySQLDatabase) => Promise<Result<T, DatabaseError>>
): Promise<Result<T, DatabaseError>> => {
	try {
		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) return err(new DatabaseError('Database connection failed'));

		return await operation(mysqlDB);
	} catch (error) {
		logger.error(errorMessage, error);
		return err(new DatabaseError(errorMessage));
	}
};

export const fetchClans = async (options: {
	mode: number;
	limit: number;
	offset: number;
}): Promise<Result<DBClan[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch clans', async (mysqlDB) => {
		if (options.limit < 1 || options.offset < 0) return ok([]);
		if (options.limit > 100) options.limit = 100;

		const clans = await mysqlDB('clans')
			.select('clans.id', 'clans.name', 'clans.tag', 'clans.owner')
			.select(mysqlDB.raw('ROUND(SUM(stats.pp)) as total_pp'))
			.count('users.id as users')
			.join('users', 'clans.id', 'users.clan_id')
			.join('stats', 'users.id', 'stats.id')
			.where('stats.mode', options.mode)
			.groupBy('clans.id', 'clans.name')
			.orderBy('total_pp', 'desc')
			.limit(options.limit)
			.offset(options.offset);

		const formattedClans = clans.map((clan) => {
			clan.total_pp = parseFloat(clan.total_pp as string);
			return clan;
		}) as DBClan[];

		return ok(formattedClans);
	});

export const fetchTopScores = async (options: {
	mode: number;
	limit?: number;
	offset?: number;
}): Promise<Result<TopScore[], DatabaseError>> =>
	withDatabaseResult('Error fetching top scores', async (mysqlDB) => {
		const limit = options.limit ?? 45;
		const offset = options.offset ?? 0;
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
			[options.mode, limit, offset]
		);

		return ok(scores[0] as TopScore[]);
	});

export const fetchTopScoresCount = async (mode: number): Promise<Result<number, DatabaseError>> =>
	withDatabaseResult('Error fetching top scores count', async (mysqlDB) => {
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

		return ok(countResult[0][0].count);
	});

export const fetchPlayCountResults = async (
	requestedUserId: string
): Promise<Result<Record<string, number>, DatabaseError>> =>
	withDatabaseResult('Failed to retrieve play count graph', async (mysqlDB) => {
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

		return ok(playCountGraph);
	});

export const fetchUserRelationships = async (
	requestedUserId: string,
	ourUser: any
): Promise<Result<UserRelationship, DatabaseError>> =>
	withDatabaseResult('Failed to fetch user relationships', async (mysqlDB) => {
		let relationships: UserRelationship = {
			followers: 0,
			relationshipStatus: 'none'
		};

		const followerResult = await mysqlDB('relationships')
			.count('* as followers')
			.where('user2', requestedUserId)
			.andWhere('user1', '!=', requestedUserId)
			.first();

		relationships.followers = Number(followerResult?.followers ?? 0);

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

		return ok(relationships);
	});

export const fetchUsersLog = async (userId: number): Promise<Result<UsersLog[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch users log', async (mysqlDB) => {
		const logs = await mysqlDB<UsersLog>('users_log')
			.where('user_id', userId)
			.orderBy('timestamp', 'desc')
			.limit(10);

		return ok(logs || []);
	});

export const pinScore = async (
	scoreID: number,
	isPinned: boolean
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to pin score', async (mysqlDB) => {
		await mysqlDB('scores')
			.update('pinned', isPinned ? 0 : 1)
			.where('id', scoreID);
		return ok(undefined);
	});

export const createFriendship = async (
	userID: number,
	friendID: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to add friend', async (mysqlDB) => {
		if (userID === friendID) return ok(undefined);

		const isMutual = await mysqlDB('relationships')
			.select('type')
			.where('user1', userID)
			.andWhere('user2', friendID)
			.first();

		if (isMutual) return ok(undefined);

		await mysqlDB('relationships').insert({
			user1: userID,
			user2: friendID,
			type: 'friend'
		});
		return ok(undefined);
	});

export const deleteFriendship = async (
	userID: number,
	friendID: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to remove friend', async (mysqlDB) => {
		if (userID === friendID) return ok(undefined);

		await mysqlDB('relationships').where('user1', userID).andWhere('user2', friendID).del();
		return ok(undefined);
	});

export const fetchOldUsernames = async (
	userID: number,
	currentUsername?: string
): Promise<Result<string, DatabaseError>> =>
	withDatabaseResult('Failed to fetch old usernames', async (mysqlDB) => {
		const old_usernames = await mysqlDB('username_log')
			.select('old_username')
			.where('user_id', userID);

		if (!old_usernames || old_usernames.length === 0) return ok('');

		const uniqueUsernames = Array.from(new Set(old_usernames.map((entry) => entry.old_username)));
		const usernames = uniqueUsernames.filter((username) => username !== currentUsername).join(', ');

		return ok(usernames);
	});

export const fetchLogTitlesBatch = async (
	logs: UsersLog[]
): Promise<Result<Record<number, string>, DatabaseError>> =>
	withDatabaseResult('Failed to batch fetch titles', async (mysqlDB) => {
		const results: Record<number, string> = {};

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
		return ok(results);
	});

export const createClanInvite = async (
	clanId: number,
	userId: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to create clan invite', async (mysqlDB) => {
		await mysqlDB('clan_invites').insert({
			clan_id: clanId,
			user_id: userId,
			status: 'pending'
		});
		return ok(undefined);
	});

export const fetchUserInvites = async (userId: number): Promise<Result<any[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch user invites', async (mysqlDB) => {
		const invites = await mysqlDB('clan_invites')
			.select(
				'clan_invites.id',
				'clans.name as clan_name',
				'clans.tag as clan_tag',
				'clan_invites.clan_id'
			)
			.join('clans', 'clan_invites.clan_id', 'clans.id')
			.where('clan_invites.user_id', userId)
			.andWhere('clan_invites.status', 'pending');
		return ok(invites);
	});

export const fetchClanInvites = async (clanId: number): Promise<Result<any[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch clan invites', async (mysqlDB) => {
		const invites = await mysqlDB('clan_invites')
			.select(
				'clan_invites.id',
				'users.name as username',
				'clan_invites.user_id',
				'clan_invites.status'
			)
			.join('users', 'clan_invites.user_id', 'users.id')
			.where('clan_invites.clan_id', clanId)
			.andWhere('clan_invites.status', 'pending');
		return ok(invites);
	});

export const createInviteResponse = async (
	inviteId: number,
	userId: number,
	status: 'accepted' | 'rejected'
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to respond to invite', async (mysqlDB) => {
		const invite = await mysqlDB('clan_invites')
			.where('id', inviteId)
			.andWhere('user_id', userId)
			.first();

		if (!invite) return ok(undefined);

		await mysqlDB.transaction(async (trx) => {
			await trx('clan_invites').where('id', inviteId).update({ status });

			if (status === 'accepted') {
				await trx('users').where('id', userId).update({ clan_id: invite.clan_id, clan_priv: 1 });
				await trx('clan_invites')
					.where('user_id', userId)
					.whereIn('status', ['pending', 'request_pending'])
					.update({ status: 'rejected' });
			}
		});
		return ok(undefined);
	});

export const deleteClanMembership = async (userId: number): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to leave clan', async (mysqlDB) => {
		await mysqlDB('users').where('id', userId).update({ clan_id: 0, clan_priv: 0 });
		return ok(undefined);
	});

export const deleteClan = async (clanId: number): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to delete clan', async (mysqlDB) => {
		await mysqlDB.transaction(async (trx) => {
			await trx('users').where('clan_id', clanId).update({ clan_id: 0 });
			await trx('clan_invites').where('clan_id', clanId).del();
			await trx('clans').where('id', clanId).del();
		});
		return ok(undefined);
	});

export const deleteInvite = async (
	inviteId: number,
	clanId: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to cancel invite', async (mysqlDB) => {
		await mysqlDB('clan_invites').where('id', inviteId).andWhere('clan_id', clanId).del();
		return ok(undefined);
	});

export const createClan = async (
	name: string,
	tag: string,
	ownerId: number
): Promise<Result<number, DatabaseError>> =>
	withDatabaseResult('Failed to create clan', async (mysqlDB) => {
		const clanId = await mysqlDB.transaction(async (trx) => {
			const [id] = await trx('clans').insert({
				name,
				tag,
				owner: ownerId
			});

			await trx('users').where('id', ownerId).update({ clan_id: id, clan_priv: 3 });

			return id;
		});
		return ok(clanId);
	});

export const createJoinRequest = async (
	clanId: number,
	userId: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to request to join clan', async (mysqlDB) => {
		await mysqlDB('clan_invites').insert({
			clan_id: clanId,
			user_id: userId,
			status: 'request_pending'
		});
		return ok(undefined);
	});

export const fetchClanJoinRequests = async (
	clanId: number
): Promise<Result<any[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch clan join requests', async (mysqlDB) => {
		const requests = await mysqlDB('clan_invites')
			.select(
				'clan_invites.id',
				'users.name as username',
				'clan_invites.user_id',
				'clan_invites.status'
			)
			.join('users', 'clan_invites.user_id', 'users.id')
			.where('clan_invites.clan_id', clanId)
			.andWhere('clan_invites.status', 'request_pending');
		return ok(requests);
	});

export const createJoinRequestResponse = async (
	requestId: number,
	clanId: number,
	status: 'accepted' | 'rejected'
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to respond to join request', async (mysqlDB) => {
		const request = await mysqlDB('clan_invites')
			.where('id', requestId)
			.andWhere('clan_id', clanId)
			.andWhere('status', 'request_pending')
			.first();

		if (!request) return ok(undefined);

		await mysqlDB.transaction(async (trx) => {
			const finalStatus = status === 'accepted' ? 'accepted' : 'rejected';
			await trx('clan_invites').where('id', requestId).update({ status: finalStatus });

			if (status === 'accepted') {
				await trx('users').where('id', request.user_id).update({ clan_id: clanId, clan_priv: 1 });
				await trx('clan_invites')
					.where('user_id', request.user_id)
					.whereIn('status', ['pending', 'request_pending'])
					.update({ status: 'rejected' });
			}
		});
		return ok(undefined);
	});

export const updateClanMemberPriv = async (
	userId: number,
	priv: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to update clan member privilege', async (mysqlDB) => {
		await mysqlDB('users').where('id', userId).update({ clan_priv: priv });
		return ok(undefined);
	});

export const createOwnershipTransfer = async (
	clanId: number,
	newOwnerId: number
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to transfer clan ownership', async (mysqlDB) => {
		await mysqlDB.transaction(async (trx) => {
			const clan = await trx('clans').where('id', clanId).first();
			if (!clan) return;

			const oldOwnerId = clan.owner;

			await trx('clans').where('id', clanId).update({ owner: newOwnerId });
			await trx('users').where('id', newOwnerId).update({ clan_priv: 3 });
			await trx('users').where('id', oldOwnerId).update({ clan_priv: 2 });
		});
		return ok(undefined);
	});

export const fetchClanMembersWithPriv = async (
	clanId: number
): Promise<Result<any[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch clan members', async (mysqlDB) => {
		const members = await mysqlDB('users')
			.select('id', 'name', 'country', 'clan_priv')
			.where('clan_id', clanId);
		return ok(members);
	});

export const deleteClanMember = async (userId: number): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to kick clan member', async (mysqlDB) => {
		await mysqlDB('users').where('id', userId).update({ clan_id: 0, clan_priv: 0 });
		return ok(undefined);
	});

export const fetchUserJoinRequests = async (
	userId: number
): Promise<Result<any[], DatabaseError>> =>
	withDatabaseResult('Failed to fetch user join requests', async (mysqlDB) => {
		const requests = await mysqlDB('clan_invites')
			.select(
				'clan_invites.id',
				'clans.name as clan_name',
				'clans.tag as clan_tag',
				'clan_invites.clan_id'
			)
			.join('clans', 'clan_invites.clan_id', 'clans.id')
			.where('clan_invites.user_id', userId)
			.andWhere('clan_invites.status', 'request_pending');
		return ok(requests);
	});

export const updateUserpage = async (
	userId: number,
	content: string
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to update userpage', async (mysqlDB) => {
		await mysqlDB('users').where('id', userId).update({ userpage_content: content });
		return ok(undefined);
	});

export const createComment = async (
	userId: number,
	fromId: number,
	comment: string
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to create comment', async (mysqlDB) => {
		await mysqlDB('profile_comments').insert({
			user_id: userId,
			from_id: fromId,
			comment: comment
		});
		return ok(undefined);
	});

export const fetchComment = async (commentId: number): Promise<Result<any, DatabaseError>> =>
	withDatabaseResult('Failed to fetch comment', async (mysqlDB) => {
		const comment = await mysqlDB('profile_comments').where('id', commentId).first();
		return ok(comment);
	});

export const updateComment = async (
	commentId: number,
	comment: string
): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to update comment', async (mysqlDB) => {
		await mysqlDB('profile_comments').where('id', commentId).update({
			comment: comment,
			updated_at: mysqlDB.fn.now()
		});
		return ok(undefined);
	});

export const deleteComment = async (commentId: number): Promise<Result<void, DatabaseError>> =>
	withDatabaseResult('Failed to delete comment', async (mysqlDB) => {
		await mysqlDB('profile_comments').where('id', commentId).delete();
		return ok(undefined);
	});
