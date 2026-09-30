import { redirect } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { isAdmin } from '$lib/privs';
import { getMySQLDatabase } from '$lib/server/connections';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(302, '/signin');
	}

	const ourUser = await getUserFromSession(sessionToken);
	if (!ourUser) {
		throw redirect(302, '/signin');
	}

	if (!isAdmin(ourUser.priv)) {
		throw redirect(302, '/');
	}

	const mysqlDatabase = await getMySQLDatabase();
	if (!mysqlDatabase) {
		throw new Error('Database connection failed');
	}

	const flags = await mysqlDatabase('scores_flag as sf')
		.join('users as u', 'u.id', 'sf.user_id')
		.join('scores as s', 's.id', 'sf.score_id')
		.leftJoin('maps as m', 'm.md5', 's.map_md5')
		.select(
			'sf.score_id',
			'sf.kind',
			'sf.reason',
			'sf.det',
			'sf.created_at',
			'u.id as user_id',
			'u.name as username',
			's.pp',
			's.acc',
			's.mode',
			's.play_time',
			'm.artist',
			'm.title',
			'm.version'
		)
		.orderBy('sf.created_at', 'desc')
		.limit(100);

	return { flags };
};

export const actions: Actions = {
	dismissFlag: async ({ request, cookies }) => {
		const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
		if (!isAdmin(sessionUser?.priv)) {
			return { success: false, error: 'Insufficient privileges' };
		}

		const data = await request.formData();
		const scoreId = Number(data.get('scoreId'));
		const kind = data.get('kind')?.toString();
		if (!scoreId || !kind) {
			return { success: false, error: 'Missing required fields' };
		}

		const mysqlDatabase = await getMySQLDatabase();
		if (!mysqlDatabase) {
			return { success: false, error: 'Database connection failed' };
		}

		await mysqlDatabase('scores_flag').where({ score_id: scoreId, kind }).del();
		return { success: true };
	}
};
