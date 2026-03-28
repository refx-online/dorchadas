import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { createInviteResponse } from '$lib/db';
import { logger } from '$lib/logger';

export const POST = async ({ request, cookies }) => {
	try {
		const sessionToken = cookies.get('sessionToken');
		if (!sessionToken) {
			throw error(401, 'Not authenticated');
		}

		const user = await getUserFromSession(sessionToken);
		if (!user) {
			throw error(401, 'Invalid session');
		}

		const { inviteId, status } = await request.json();

		if (!inviteId || !status || !['accepted', 'rejected'].includes(status)) {
			return json({ message: 'Invalid request' }, { status: 400 });
		}

		const result = await createInviteResponse(inviteId, user.id, status);
		if (!result.ok) {
			throw error(500, 'Failed to respond to invite');
		}

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		logger.error('Failed to respond to invite', err);
		throw error(500, 'Failed to respond to invite');
	}
};
