import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fail, error } from '@sveltejs/kit';
import { getMySQLDatabase, getRedisClient } from '$lib/server/connections';
import { usernameRegex } from '$lib/regex';
import { countryCodes } from '$lib/country';
import { VALID_MODES } from '$lib/modes';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';

async function sendDiscordWebhookLog(logType: string, message: string, avatarUrl?: string) {
	try {
		const webhookUrl = env.DISCORD_WEBHOOK_LOG;
		if (!webhookUrl) {
			logger.error('Discord webhook URL is not set');
			return;
		}

		const payload: Record<string, any> = {
			content: message,
			username: logType
		};

		if (avatarUrl) {
			payload.avatar_url = avatarUrl;
		}

		const response = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			logger.error('Failed to send Discord webhook', await response.text());
		}
	} catch (error) {
		logger.error('Error sending Discord webhook:', error);
	}
}

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(302, '/signin');
	}

	const user = await getUserFromSession(sessionToken);
	if (!user) {
		throw redirect(302, '/signin');
	}

	return {
		user: {
			id: user.id,
			username: user.name,
			preferredMetric: user.preferred_metric,
			preferredMode: user.preferred_mode ?? 0,
			country: user.country,
			clanId: user.clan_id
		}
	};
};

export const actions = {
	changeUsername: async ({ request, cookies }) => {
		const sessionToken = cookies.get('sessionToken');
		const user = await getUserFromSession(sessionToken);
		const mysqlDatabase = await getMySQLDatabase();
		if (!mysqlDatabase) {
			return fail(500, { error: 'Database connection failed' });
		}
		const data = await request.formData();
		const newUsername = data.get('newUsername')?.toString().trim();

		if (!sessionToken) {
			throw redirect(302, '/signin');
		}

		if (!user) {
			throw redirect(302, '/signin');
		}

		if (!mysqlDatabase) {
			throw error(500, 'Database connection failed');
		}

		if (!newUsername) {
			return fail(400, { message: 'Username cannot be empty' });
		}

		// ensures the username is between 2-20 characters long
		// allows the first part of the username to consist of alphanumeric characters
		// allows optional groups of a space followed by alphanumeric characters
		if (!usernameRegex.test(newUsername)) {
			return fail(400, { message: 'Invalid username format' });
		}

		try {
			// username change are free on this server
			// so we need this check to prevent users from changing their names too quickly
			const lastNameChange = await mysqlDatabase
				.select('last_namechange')
				.from('users')
				.where('id', user.id)
				.first();

			const cd = 86400; // 24 hours
			const currentTime = Math.floor(Date.now() / 1000);

			if (currentTime - cd < lastNameChange.last_namechange) {
				const remainingSeconds = lastNameChange.last_namechange + cd - currentTime;
				const hours = Math.floor(remainingSeconds / 3600);
				const minutes = Math.floor((remainingSeconds % 3600) / 60);
				return fail(400, {
					message: `You're on timeout. ${hours.toString().padStart(2, '0')} hours ${minutes.toString().padStart(2, '0')} minutes left`
				});
			}

			// get existing user from the new username,
			// if exist we throw username already taken
			const existingUser = await mysqlDatabase
				.select('id')
				.from('users')
				.where('name', newUsername)
				.first();

			if (existingUser) {
				return fail(400, { message: 'Username already taken' });
			}

			const safeName = newUsername.toLowerCase().trim().replace(/ /g, '_');

			// all checks are passed, update their username
			// if their old username exist, we remove
			await mysqlDatabase('username_log')
				.delete()
				.where('user_id', user.id)
				.andWhere('old_username', user.name);

			// insert their old username to username_log for logging
			await mysqlDatabase.raw(
				`INSERT INTO username_log (user_id, old_username, time)
                 VALUES (?, ?, NOW())`,
				[user.id, user.name]
			);

			// now we update the username with the last namechange time
			await mysqlDatabase('users').where('id', user.id).update({
				name: newUsername,
				safe_name: safeName,
				last_namechange: currentTime
			});

			// TODO: make this a bit cooler
			sendDiscordWebhookLog(
				'change name',
				`${user.name} (${user.id}) -> ${newUsername} (${user.id})`
			);

			return { success: true };
		} catch (err) {
			logger.error('Failed to change username', err);
			return fail(500, { message: 'An error occurred while updating username' });
		}
	},
	changeMetric: async ({ request, cookies }) => {
		const sessionToken = cookies.get('sessionToken');
		const user = await getUserFromSession(sessionToken);
		const mysqlDatabase = await getMySQLDatabase();
		if (!mysqlDatabase) {
			return fail(500, { error: 'Database connection failed' });
		}
		const data = await request.formData();
		const preferredMetric = data.get('preferredMetric')?.toString();

		if (!sessionToken) {
			throw redirect(302, '/signin');
		}

		if (!user) {
			throw redirect(302, '/signin');
		}

		if (!mysqlDatabase) {
			throw error(500, 'Database connection failed');
		}

		if (!preferredMetric || !['pp', 'score'].includes(preferredMetric)) {
			return fail(400, { message: 'Invalid ranking metric' });
		}

		try {
			await mysqlDatabase('users').where('id', user.id).update({
				preferred_metric: preferredMetric
			});
			return { success: true };
		} catch (err) {
			logger.error('Failed to change metric', err);
			return fail(500, { message: 'An error occurred while updating ranking metric' });
		}
	},
	changeCountry: async ({ request, cookies }) => {
		const sessionToken = cookies.get('sessionToken');
		if (!sessionToken) {
			throw redirect(302, '/signin');
		}

		const user = await getUserFromSession(sessionToken);
		if (!user) {
			throw redirect(302, '/signin');
		}

		const mysqlDatabase = await getMySQLDatabase();
		if (!mysqlDatabase) {
			return fail(500, { error: 'Database connection failed' });
		}

		const data = await request.formData();
		const code = data.get('country')?.toString().trim().toUpperCase();

		if (!code || !countryCodes.includes(code)) {
			return fail(400, { message: 'Invalid country' });
		}

		const newCountry = code.toLowerCase();

		try {
			const row = await mysqlDatabase
				.select('country', 'last_countrychange')
				.from('users')
				.where('id', user.id)
				.first();

			if (row.country === newCountry) {
				return fail(400, { message: 'That is already your country' });
			}

			// flag changes are free but slow, same idea as the username timeout
			const cd = 7 * 86400; // 7 days
			const currentTime = Math.floor(Date.now() / 1000);

			if (currentTime - cd < row.last_countrychange) {
				const remainingSeconds = row.last_countrychange + cd - currentTime;
				const days = Math.floor(remainingSeconds / 86400);
				const hours = Math.floor((remainingSeconds % 86400) / 3600);
				return fail(400, {
					message: `You're on timeout. ${days} days ${hours.toString().padStart(2, '0')} hours left`
				});
			}

			const oldCountry = row.country;

			await mysqlDatabase('users').where('id', user.id).update({
				country: newCountry,
				last_countrychange: currentTime
			});

			// move leaderboard entries onto the new country keys
			const stats = await mysqlDatabase
				.select('mode', 'pp')
				.from('stats')
				.where('id', user.id)
				.andWhere('pp', '>', 0);

			const redis = await getRedisClient();
			if (redis) {
				for (const s of stats) {
					await redis.zRem(`bancho:leaderboard:${s.mode}:${oldCountry}`, String(user.id));
					await redis.zAdd(`bancho:leaderboard:${s.mode}:${newCountry}`, [
						{ score: Number(s.pp), value: String(user.id) }
					]);
				}
			}

			sendDiscordWebhookLog(
				'change country',
				`${user.name} (${user.id}) ${oldCountry} -> ${newCountry}`
			);

			return { success: true };
		} catch (err) {
			logger.error('Failed to change country', err);
			return fail(500, { message: 'An error occurred while updating country' });
		}
	},
	changeMode: async ({ request, cookies }) => {
		const sessionToken = cookies.get('sessionToken');
		if (!sessionToken) {
			throw redirect(302, '/signin');
		}

		const user = await getUserFromSession(sessionToken);
		if (!user) {
			throw redirect(302, '/signin');
		}

		const mysqlDatabase = await getMySQLDatabase();
		if (!mysqlDatabase) {
			return fail(500, { error: 'Database connection failed' });
		}

		const data = await request.formData();
		const mode = Number(data.get('preferredMode'));

		if (!VALID_MODES.includes(mode)) {
			return fail(400, { message: 'Invalid mode' });
		}

		try {
			await mysqlDatabase('users').where('id', user.id).update({
				preferred_mode: mode
			});
			return { success: true };
		} catch (err) {
			logger.error('Failed to change main mode', err);
			return fail(500, { message: 'An error occurred while updating main mode' });
		}
	}
};
