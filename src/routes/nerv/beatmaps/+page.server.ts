import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { canModifyMapStatus } from '$lib/privs';
import { getMySQLDatabase } from '$lib/server/connections';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) redirect(302, '/signin');

	const ourUser = await getUserFromSession(sessionToken);
	if (!ourUser) redirect(302, '/signin');
	if (!canModifyMapStatus(ourUser.priv)) redirect(400, '/home');

	const db = await getMySQLDatabase();
	const queue = db
		? await db('map_requests')
				.join('maps', 'map_requests.map_id', 'maps.id')
				.join('users', 'map_requests.player_id', 'users.id')
				.select(
					'map_requests.id',
					'map_requests.map_id',
					'map_requests.player_id',
					'map_requests.datetime',
					'maps.title',
					'maps.artist',
					'maps.version',
					'maps.set_id',
					'maps.status',
					'users.name as requester'
				)
				.where('map_requests.active', 1)
				.orderBy('map_requests.datetime', 'asc')
		: [];

	return { ourUser, queue };
};
