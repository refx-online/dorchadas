import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchClan } from '$lib/api';
import { createJoinRequest } from '$lib/db';
import { getMySQLDatabase } from '../../../../hooks.server';
import { logger } from '$lib/logger';

export const POST = async ({ cookies, params }) => {
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

		if (user.clan_id !== 0) {
			return json({ message: 'You are already in a clan' }, { status: 400 });
		}

		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) {
			throw error(500, 'Database connection failed');
		}

		// Check if already requested or invited
		const existingInvite = await mysqlDB('clan_invites')
			.where({ clan_id: clanId, user_id: user.id })
			.whereIn('status', ['pending', 'request_pending'])
			.first();

		if (existingInvite) {
			return json(
				{ message: 'You already have a pending invite or request for this clan' },
				{ status: 400 }
			);
		}

		const requestResult = await createJoinRequest(clanId, user.id);
		if (!requestResult.ok) {
			throw error(500, 'Failed to request to join clan');
		}

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to request to join clan', err);
		throw error(500, 'Failed to request to join clan');
	}
};
