import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchClan } from '$lib/api';
import { getMySQLDatabase } from '../../../../../hooks.server';
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
		const clan = clanResult.value;

		if (user.clan_id !== clanId || user.clan_priv < 3) {
			throw error(403, 'Only the clan owner can change settings');
		}

		const { name, tag } = await request.json();

		if (!name || name.length < 2 || name.length > 32) {
			return json({ message: 'Clan name must be between 2 and 32 characters' }, { status: 400 });
		}

		if (!tag || tag.length < 2 || tag.length > 6) {
			return json({ message: 'Clan tag must be between 2 and 6 characters' }, { status: 400 });
		}

		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) {
			throw error(500, 'Database connection failed');
		}

		// Check for uniqueness if changed
		if (name !== clan.name) {
			const existingName = await mysqlDB('clans').where('name', name).first();
			if (existingName) {
				return json({ message: 'Clan name already taken' }, { status: 400 });
			}
		}

		if (tag !== clan.tag) {
			const existingTag = await mysqlDB('clans').where('tag', tag).first();
			if (existingTag) {
				return json({ message: 'Clan tag already taken' }, { status: 400 });
			}
		}

		await mysqlDB('clans').where('id', clanId).update({
			name: name,
			tag: tag
		});

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to update clan settings', err);
		throw error(500, 'Failed to update clan settings');
	}
};
