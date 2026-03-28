import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { deleteInvite } from '$lib/db';
import { fetchClan } from '$lib/api';
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

		if (user.clan_id !== clanId || user.clan_priv < 2) {
			throw error(403, 'Only the clan owner or officers can cancel invites');
		}

		const { inviteId } = await request.json();

		if (!inviteId) {
			return json({ message: 'Invite ID is required' }, { status: 400 });
		}

		const cancelResult = await deleteInvite(inviteId, clanId);
		if (!cancelResult.ok) {
			throw error(500, 'Failed to cancel invite');
		}

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to cancel invite', err);
		throw error(500, 'Failed to cancel invite');
	}
};
