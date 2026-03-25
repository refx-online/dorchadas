import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { leaveClan, deleteClan } from '$lib/db';
import { getClan } from '$lib/api';

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

		if (clan.owner.id === user.id) {
			// Owner is deleting the clan
			// But they can only delete if they are the last member
			if (clan.members.length > 1) {
				return json(
					{
						success: false,
						message: 'You must transfer ownership before leaving or deleting the clan.'
					},
					{ status: 400 }
				);
			}
			await deleteClan(clanId);
			return json({ success: true, action: 'deleted' });
		} else {
			// Member is leaving the clan
			if (user.clan_id !== clanId) {
				throw error(403, 'You are not a member of this clan');
			}
			await leaveClan(user.id);
			return json({ success: true, action: 'left' });
		}
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to leave/delete clan:', err);
		throw error(500, 'Failed to leave/delete clan');
	}
};
