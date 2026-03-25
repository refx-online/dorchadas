import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getUserInvites } from '$lib/db';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		redirect(302, '/signin');
	}

	const user = await getUserFromSession(sessionToken);
	if (!user) {
		redirect(302, '/signin');
	}

	const invites = await getUserInvites(user.id);

	return {
		user: {
			id: user.id,
			username: user.name
		},
		invites
	};
};
