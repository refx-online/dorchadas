import { json } from '@sveltejs/kit';
import { getMySQLDatabase } from '../../../../hooks.server';

export async function GET({ params }) {
    try {
        const mysqlDatabase = await getMySQLDatabase();

        const comments = await mysqlDatabase('profile_comments')
            .select(
                'profile_comments.*',
                'users.name as from_name'
            )
            .leftJoin('users', 'profile_comments.from_id', 'users.id')
            .where('profile_comments.user_id', params.userId)
            .orderBy('profile_comments.created_at', 'desc');

        return json(comments);
    } catch (error) {
        console.error('Failed to fetch comments', error);
        return json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}