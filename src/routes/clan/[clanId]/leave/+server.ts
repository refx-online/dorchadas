import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { deleteClanMembership, deleteClan } from '$lib/db';
import { fetchClan } from '$lib/api';
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
		const clan = clanResult.value;

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
			const result = await deleteClan(clanId);
			if (!result.ok) {
				throw error(500, 'Failed to delete clan');
			}
			return json({ success: true, action: 'deleted' });
		} else {
			// Member is leaving the clan
			if (user.clan_id !== clanId) {
				throw error(403, 'You are not a member of this clan');
			}
			const result = await deleteClanMembership(user.id);
			if (!result.ok) {
				throw error(500, 'Failed to leave clan');
			}
			return json({ success: true, action: 'left' });
		}
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to leave/delete clan', err);
		throw error(500, 'Failed to leave/delete clan');
	}
};
