import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getClan } from '$lib/api';
import { respondToJoinRequest } from '$lib/db';

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
			throw error(403, 'Only the clan owner can respond to requests');
		}

		const { requestId, status } = await request.json();

		if (!requestId || !status || !['accepted', 'rejected'].includes(status)) {
			return json({ message: 'Invalid request data' }, { status: 400 });
		}

		await respondToJoinRequest(requestId, clanId, status);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to respond to join request:', err);
		throw error(500, 'Failed to respond to join request');
	}
};
