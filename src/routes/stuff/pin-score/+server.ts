// got no other choice
// im actually braindead on this
// sowwy
// atleast it works
import { error } from '@sveltejs/kit';
import { pinScore } from '$lib/db';

export const POST = async ({ request }) => {
    const { scoreid, isPinned, currentUserId, userId } = await request.json();

    if (currentUserId !== userId) {
        error(403, 'Unauthorized');
    }

    try {
        await pinScore(scoreid, isPinned)

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Pin score error:', err);
        error(500, 'Failed to update score');
    }
};