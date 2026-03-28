import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchClan } from '$lib/api';
import { deleteClanMember } from '$lib/db';
import { getMySQLDatabase } from '../../../../../../hooks.server.js';
import { logger } from '$lib/logger';

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

		const clanResult = await fetchClan(clanId);
		if (!clanResult.ok) {
			throw error(404, 'Clan not found');
		}

		// Check if user is owner or officer
		// Owner is clan_priv 3, Officer is clan_priv 2
		if (user.clan_id !== clanId || user.clan_priv < 2) {
			throw error(403, 'Only the clan owner or officers can kick members');
		}

		const { targetUserId } = await request.json();
		if (!targetUserId) {
			return json({ message: 'Target user ID is required' }, { status: 400 });
		}

		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) throw error(500, 'Database connection failed');

		const targetUser = await mysqlDB('users').where('id', targetUserId).first();
		if (!targetUser || targetUser.clan_id !== clanId) {
			return json({ message: 'User not found in this clan' }, { status: 404 });
		}

		// Officers can only kick members (clan_priv 1)
		// Owners can kick anyone except themselves
		if (user.clan_priv === 2 && targetUser.clan_priv >= 2) {
			throw error(403, 'Officers can only kick regular members');
		}

		if (targetUser.id === user.id) {
			throw error(400, 'You cannot kick yourself');
		}

		const kickResult = await deleteClanMember(targetUserId);
		if (!kickResult.ok) {
			throw error(500, 'Failed to kick member');
		}

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to kick member', err);
		throw error(500, 'Failed to kick member');
	}
};
