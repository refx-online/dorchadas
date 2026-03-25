import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getClan } from '$lib/api';
import { requestToJoinClan } from '$lib/db';
import { getMySQLDatabase } from '../../../../hooks.server';

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

		const clan = await getClan(clanId);
		if (!clan) {
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

		await requestToJoinClan(clanId, user.id);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to request to join clan:', err);
		throw error(500, 'Failed to request to join clan');
	}
};
