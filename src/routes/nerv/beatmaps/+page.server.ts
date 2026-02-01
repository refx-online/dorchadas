import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { canModifyMapStatus } from '$lib/privs';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		redirect(302, '/signin');
	}

	const ourUser = await getUserFromSession(sessionToken);
	if (!ourUser) {
		redirect(302, '/signin');
	}

	if (!canModifyMapStatus(ourUser.priv)) {
		redirect(400, '/home');
	}

	return {
		ourUser
	};
};
