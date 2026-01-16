import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase } from '../../../../hooks.server';

export const GET: RequestHandler = async ({ params }) => {
	try {
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
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to fetch comments');
	}
};
