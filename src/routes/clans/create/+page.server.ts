import { redirect, fail } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { createClan } from '$lib/db';
import { getMySQLDatabase } from '../../../hooks.server';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		redirect(302, '/signin');
	}

	const user = await getUserFromSession(sessionToken);
	if (!user) {
		redirect(302, '/signin');
	}

	if (user.clan_id !== 0) {
		redirect(302, `/clan/${user.clan_id}`);
	}

	return {
		user: {
			id: user.id,
			username: user.name
		}
	};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const sessionToken = cookies.get('sessionToken');
		const user = await getUserFromSession(sessionToken);
		if (!user || user.clan_id !== 0) {
			return fail(403, { message: 'Unauthorized or already in a clan' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const tag = data.get('tag')?.toString().trim();

		if (!name || name.length < 2 || name.length > 32) {
			return fail(400, { message: 'Clan name must be between 2 and 32 characters' });
		}

		if (!tag || tag.length < 2 || tag.length > 6) {
			return fail(400, { message: 'Clan tag must be between 2 and 6 characters' });
		}

		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) {
			return fail(500, { message: 'Database connection failed' });
		}

		const existingName = await mysqlDB('clans').where('name', name).first();
		if (existingName) {
			return fail(400, { message: 'Clan name already taken' });
		}

		const existingTag = await mysqlDB('clans').where('tag', tag).first();
		if (existingTag) {
			return fail(400, { message: 'Clan tag already taken' });
		}

		let clanId = 0;
		try {
			clanId = await createClan(name, tag, user.id);
			if (!clanId) {
				return fail(500, { message: 'Failed to create clan' });
			}
		} catch (err) {
			console.error('Clan creation error:', err);
			return fail(500, { message: 'An error occurred during clan creation' });
		}
		redirect(302, `/clan/${clanId}`);
	}
};
