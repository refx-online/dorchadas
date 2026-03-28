import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchClan } from '$lib/api';
import { updateClanMemberPriv } from '$lib/db';
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

		// Officers can promote to officer (2)
		// Owners can promote to officer (2) or transfer ownership (3) via a different endpoint
		if (user.clan_id !== clanId || user.clan_priv < 2) {
			throw error(403, 'Only the clan owner or officers can promote members');
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

		// Target must be a member
		if (targetUser.clan_priv !== 1) {
			return json({ message: 'User is not a regular member' }, { status: 400 });
		}

		// Officers can promote to officer
		const updateResult = await updateClanMemberPriv(targetUserId, 2);
		if (!updateResult.ok) {
			throw error(500, 'Failed to promote member');
		}

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to promote member', err);
		throw error(500, 'Failed to promote member');
	}
};
