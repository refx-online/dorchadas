import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase } from '$lib/server/connections';
import { withApiErrorHandling } from '$lib/server/http';

export const GET: RequestHandler = withApiErrorHandling(
	'Failed to fetch comments',
	async ({ params }) => {
		const mysqlDatabase = await getMySQLDatabase();
		if (!mysqlDatabase) {
			throw error(500, 'Database connection failed');
		}

		const comments = await mysqlDatabase('profile_comments')
			.select('profile_comments.*', 'users.name as from_name')
			.leftJoin('users', 'profile_comments.from_id', 'users.id')
			.where('profile_comments.user_id', params.userId)
			.orderBy('profile_comments.created_at', 'desc');

		return json(comments);
	}
);
