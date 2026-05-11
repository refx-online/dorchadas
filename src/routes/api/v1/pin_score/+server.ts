import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { pinScore } from '$lib/db';
import { withApiErrorHandling } from '$lib/server/http';

export const POST: RequestHandler = withApiErrorHandling(
	'Failed to update score',
	async ({ request }) => {
		const { score_id, pinned, current_user_id, user_id } = await request.json();

		if (current_user_id !== user_id) {
			throw error(403, 'Unauthorized');
		}

		const result = await pinScore(score_id, pinned);
		if (!result.ok) {
			throw error(500, 'Failed to update score');
		}

		return json({ success: true });
	}
);
