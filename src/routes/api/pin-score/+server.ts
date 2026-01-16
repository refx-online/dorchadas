import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { pinScore } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { scoreid, isPinned, currentUserId, userId } = await request.json();

		if (currentUserId !== userId) {
			throw error(403, 'Unauthorized');
		}

		await pinScore(scoreid, isPinned);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update score');
	}
};
