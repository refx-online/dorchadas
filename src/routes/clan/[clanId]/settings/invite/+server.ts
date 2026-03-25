import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getClan } from '$lib/api';
import { createClanInvite } from '$lib/db';
import { getMySQLDatabase } from '../../../../../hooks.server';

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

		if (clan.owner.id !== user.id) {
			throw error(403, 'Only the clan owner can invite users');
		}

		const { username } = await request.json();

		if (!username) {
			return json({ message: 'Username is required' }, { status: 400 });
		}

		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) {
			throw error(500, 'Database connection failed');
		}

		const targetUser = await mysqlDB('users').where('name', username).first();
		if (!targetUser) {
			return json({ message: 'User not found' }, { status: 404 });
		}

		if (targetUser.clan_id !== 0) {
			return json({ message: 'User is already in a clan' }, { status: 400 });
		}

		// Check if already invited
		const existingInvite = await mysqlDB('clan_invites')
			.where({ clan_id: clanId, user_id: targetUser.id, status: 'pending' })
			.first();

		if (existingInvite) {
			return json({ message: 'User already has a pending invite' }, { status: 400 });
		}

		await createClanInvite(clanId, targetUser.id);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to invite user:', err);
		throw error(500, 'Failed to invite user');
	}
};
