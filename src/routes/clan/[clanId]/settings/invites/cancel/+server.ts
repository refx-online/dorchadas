import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { cancelInvite } from '$lib/db';
import { getClan } from '$lib/api';

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
			throw error(403, 'Only the clan owner can cancel invites');
		}

		const { inviteId } = await request.json();

		if (!inviteId) {
			return json({ message: 'Invite ID is required' }, { status: 400 });
		}

		await cancelInvite(inviteId, clanId);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Failed to cancel invite:', err);
		throw error(500, 'Failed to cancel invite');
	}
};
