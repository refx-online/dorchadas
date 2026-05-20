import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase } from '$lib/server/connections';
import { getUserFromSession } from '$lib/user';
import { canModifyMapStatus } from '$lib/privs';
import { withApiErrorHandling } from '$lib/server/http';

export const POST: RequestHandler = withApiErrorHandling(
	'Failed to dismiss queue request',
	async ({ request, cookies }) => {
		const user = await getUserFromSession(cookies.get('sessionToken'));
		if (!user || !canModifyMapStatus(user.priv)) throw error(403, 'Unauthorized');

		const { id } = await request.json();
		if (!id) throw error(400, 'Missing request id');

		const db = await getMySQLDatabase();
		if (!db) throw error(500, 'Database connection failed');

		await db('map_requests').where('id', id).update({ active: 0 });

		return json({ status: 'success' });
	}
);
