import { getClan } from '$lib/api';
import { isNumber } from '$lib/stringUtil.js';
import { getUserFromSession } from '$lib/user';

export async function load({ params, cookies, locals }) {
	const clanId = params.clanId;
	if (!isNumber(clanId)) return {};
	const clan = await getClan(parseInt(clanId));

	const sessionToken = cookies.get('sessionToken');
	let isOwner = false;
	let isMember = false;

	if (sessionToken && clan) {
		const user = await getUserFromSession(sessionToken);
		if (user) {
			if (user.id === clan.owner.id) {
				isOwner = true;
			}
			if (user.clan_id === clan.id) {
				isMember = true;
			}
		}
	}

	return {
		clan,
		isOwner,
		isMember,
		csrfToken: locals.csrfToken
	};
}
