import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { isStaff } from '$lib/privs';
import { getMySQLDatabase } from '$lib/server/connections';

export const load = async ({ cookies, url }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(302, '/signin');
	}

	const ourUser = await getUserFromSession(sessionToken);
	if (!ourUser) {
		throw redirect(302, '/signin');
	}

	if (!isStaff(ourUser.priv)) {
		throw redirect(302, '/');
	}

	const userFilter = url.searchParams.get('user')?.trim() ?? '';
	const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 100, 1), 500);

	const mysqlDatabase = await getMySQLDatabase();
	if (!mysqlDatabase) {
		throw new Error('Database connection failed');
	}

	const reports = await mysqlDatabase('performance_reports as pr')
		.join('scores as s', 's.id', 'pr.scoreid')
		.join('users as u', 'u.id', 's.userid')
		.select(
			'pr.scoreid',
			'pr.mod_mode',
			'pr.os',
			'pr.fullscreen',
			'pr.fps_cap',
			'pr.compatibility',
			'pr.version',
			'pr.start_time',
			'pr.end_time',
			'pr.frame_count',
			'pr.spike_frames',
			'pr.aim_rate',
			'pr.completion',
			'pr.average_frametime',
			'u.id as user_id',
			'u.name as username',
			's.pp',
			's.acc',
			's.mode',
			's.map_md5'
		)
		.modify((qb) => {
			if (/^\d+$/.test(userFilter)) {
				qb.where('u.id', Number(userFilter));
			} else if (userFilter) {
				qb.where('u.name', 'like', `%${userFilter}%`);
			}
		})
		.orderBy('pr.scoreid', 'desc')
		.limit(limit);

	return { reports, userFilter, limit };
};
