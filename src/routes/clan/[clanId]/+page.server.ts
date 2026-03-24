import { getClan } from '$lib/api';
import { isNumber } from '$lib/stringUtil.js';
import { getUserFromSession } from '$lib/user';

export async function load({ params, cookies }) {
	const clanId = params.clanId;
	if (!isNumber(clanId)) return {};
	const clan = await getClan(parseInt(clanId));

	const sessionToken = cookies.get('sessionToken');
	let isOwner = false;

	if (sessionToken && clan) {
		const user = await getUserFromSession(sessionToken);
		if (user && user.id === clan.owner.id) {
			isOwner = true;
		}
	}

	return {
		clan,
		isOwner
	};
}
