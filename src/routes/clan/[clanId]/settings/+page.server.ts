import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fetchClan } from '$lib/api';
import { isNumber } from '$lib/string-util';
import { fetchClanInvites, fetchClanJoinRequests } from '$lib/db';

export const load = async ({ cookies, params, locals }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(302, '/signin');
	}

	const user = await getUserFromSession(sessionToken);
	if (!user) {
		throw redirect(302, '/signin');
	}

	const clanId = params.clanId;
	if (!isNumber(clanId)) {
		throw redirect(302, '/');
	}

	const clanResult = await fetchClan(parseInt(clanId));
	if (!clanResult.ok) {
		throw redirect(302, '/');
	}
	const clan = clanResult.value;

	// Ensure the user is the clan owner or an officer
	if (user.clan_id !== clan.id || user.clan_priv < 2) {
		throw redirect(302, `/clan/${clan.id}`);
	}

	const invitesResult = await fetchClanInvites(clan.id);
	const requestsResult = await fetchClanJoinRequests(clan.id);

	return {
		user: {
			id: user.id,
			username: user.name
		},
		clan,
		invites: invitesResult.ok ? invitesResult.value : [],
		requests: requestsResult.ok ? requestsResult.value : [],
		csrfToken: locals.csrfToken
	};
};
