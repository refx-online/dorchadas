import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { pinScore } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { score_id, pinned, current_user_id, user_id } = await request.json();

		if (current_user_id !== user_id) {
			throw error(403, 'Unauthorized');
		}

		await pinScore(score_id, pinned);

		return json({ success: true });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update score');
	}
};
