import { fetchPlayerCounts } from '$lib/api';
import { getMySQLDatabase } from '$lib/server/connections';
import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { isStaff, Privileges } from '$lib/privs';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(302, '/signin');
	}

	const OurUser = await getUserFromSession(sessionToken);
	if (!OurUser) {
		throw redirect(302, '/signin');
	}

	// privileges check
	if (!isStaff(OurUser.priv)) {
		throw redirect(302, '/');
	}

	const userCountsResult = await fetchPlayerCounts();
	const userCounts = userCountsResult.ok ? userCountsResult.value : undefined;

	const mysqlDatabase = await getMySQLDatabase();
	if (!mysqlDatabase) {
		throw new Error('Database connection failed');
	}

	const recentAccounts = await mysqlDatabase('users')
		.select('id', 'name', 'creation_time')
		.where('priv', '&', 1 << 1)
		.orderBy('creation_time', 'desc')
		.limit(10);

	const rankedMapsCount = await mysqlDatabase('maps')
		.where('status', '=', 2)
		.count('* as count')
		.first()
		.then((result) => (result ? result.count : 0));

	const restrictedAccountsCount = await mysqlDatabase('users')
		.whereRaw('priv & ? = 0', [Privileges.UNRESTRICTED])
		.count('* as count')
		.first()
		.then((result) => (result ? result.count : 0));

	const totalPP = await mysqlDatabase('scores')
		.sum('pp as total')
		.first()
		.then((result) => result?.total ?? 0);

	const scoreCount = await mysqlDatabase('scores')
		.count('* as count')
		.first()
		.then((result) => result?.count ?? 0);

	const totalPlays = await mysqlDatabase('stats')
		.sum('plays as total')
		.first()
		.then((result) => result?.total ?? 0);

	const flagCount = await mysqlDatabase('scores_flag')
		.count('* as count')
		.first()
		.then((result) => result?.count ?? 0);

	const recentScores = await mysqlDatabase('scores as s')
		.join('users as u', 'u.id', 's.userid')
		.select('s.id', 's.pp', 's.mode', 's.play_time', 'u.id as user_id', 'u.name as username')
		.orderBy('s.id', 'desc')
		.limit(8);

	const recentFlags = await mysqlDatabase('scores_flag as sf')
		.join('users as u', 'u.id', 'sf.user_id')
		.select('sf.score_id', 'sf.kind', 'sf.created_at', 'u.id as user_id', 'u.name as username')
		.orderBy('sf.created_at', 'desc')
		.limit(8);

	return {
		userCounts,
		recentAccounts,
		rankedMapsCount,
		restrictedAccountsCount,
		totalPP,
		scoreCount,
		totalPlays,
		flagCount,
		recentScores,
		recentFlags,

		OurUser
	};
};
