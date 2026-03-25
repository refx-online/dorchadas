import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getClan } from '$lib/api';
import { transferClanOwnership } from '$lib/db';
import { getMySQLDatabase } from '../../../../../../hooks.server.js';

export const POST = async ({ request, cookies, params }) => {
	try {
		const sessionToken = cookies.get('sessionToken');
		if (!sessionToken) {
			throw error(401, 'Not authenticated');
		}

		const user = await getUserFromSession(sessionToken);
		if (!user) {
			throw error(401, 'Invalid session');
		}

		const clanId = parseInt(params.clanId);
		if (isNaN(clanId)) {
			throw error(400, 'Invalid clan ID');
		}

		const clan = await getClan(clanId);
		if (!clan) {
			throw error(404, 'Clan not found');
		}

		// Only owner can transfer ownership
		if (user.clan_id !== clanId || user.clan_priv < 3) {
			throw error(403, 'Only the clan owner can transfer ownership');
		}

		const { targetUserId } = await request.json();
		if (!targetUserId) {
			return json({ message: 'Target user ID is required' }, { status: 400 });
		}

		if (targetUserId === user.id) {
			return json({ message: 'You are already the owner' }, { status: 400 });
		}

		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) throw error(500, 'Database connection failed');

		const targetUser = await mysqlDB('users').where('id', targetUserId).first();
		if (!targetUser || targetUser.clan_id !== clanId) {
			return json({ message: 'User not found in this clan' }, { status: 404 });
		}

		await transferClanOwnership(clanId, targetUserId);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to transfer ownership:', err);
		throw error(500, 'Failed to transfer ownership');
	}
};
