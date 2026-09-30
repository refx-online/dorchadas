import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchUserInvites } from '$lib/db';

export const load = async ({ cookies, locals }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		redirect(302, '/signin');
	}

	const user = await getUserFromSession(sessionToken);
	if (!user) {
		redirect(302, '/signin');
	}

	const invitesResult = await fetchUserInvites(user.id);
	const invites = invitesResult.ok ? invitesResult.value : [];

	return {
		user: {
			id: user.id,
			username: user.name
		},
		invites,
		csrfToken: locals.csrfToken
	};
};
