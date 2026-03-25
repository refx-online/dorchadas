import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getClan } from '$lib/api';
import { isNumber } from '$lib/stringUtil';
import { getClanInvites } from '$lib/db';

export const load = async ({ cookies, params, locals }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		redirect(302, '/signin');
	}

	const user = await getUserFromSession(sessionToken);
	if (!user) {
		redirect(302, '/signin');
	}

	const clanId = params.clanId;
	if (!isNumber(clanId)) {
		redirect(302, '/');
	}

	const clan = await getClan(parseInt(clanId));
	if (!clan) {
		redirect(302, '/');
	}

	// Ensure the user is the clan owner
	if (clan.owner.id !== user.id) {
		redirect(302, `/clan/${clan.id}`);
	}

	const invites = await getClanInvites(clan.id);

	return {
		user: {
			id: user.id,
			username: user.name
		},
		clan,
		invites,
		csrfToken: locals.csrfToken
	};
};
