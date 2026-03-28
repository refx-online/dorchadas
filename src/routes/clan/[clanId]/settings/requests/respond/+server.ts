import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchClan } from '$lib/api';
import { createJoinRequestResponse } from '$lib/db';
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
			throw error(403, 'Only the clan owner or officers can respond to requests');
		}

		const { requestId, status } = await request.json();

		if (!requestId || !status || !['accepted', 'rejected'].includes(status)) {
			return json({ message: 'Invalid request data' }, { status: 400 });
		}

		const respondResult = await createJoinRequestResponse(requestId, clanId, status);
		if (!respondResult.ok) {
			throw error(500, 'Failed to respond to join request');
		}

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to respond to join request', err);
		throw error(500, 'Failed to respond to join request');
	}
};
