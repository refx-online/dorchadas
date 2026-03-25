import { getClan } from '$lib/api';
import { isNumber } from '$lib/stringUtil.js';
import { getUserFromSession } from '$lib/user';
import { getMySQLDatabase } from '../../../hooks.server.js';

export async function load({ params, cookies, locals }) {
	const clanIdStr = params.clanId;
	if (!isNumber(clanIdStr)) return {};
	const clanId = parseInt(clanIdStr);
	const clan = await getClan(clanId);

	const sessionToken = cookies.get('sessionToken');
	let isOwner = false;
	let isMember = false;
	let hasPendingRequest = false;
	let currentUser = null;

	if (sessionToken && clan) {
		const user = await getUserFromSession(sessionToken);
		if (user) {
			currentUser = {
				id: user.id,
				clanId: user.clan_id
			};
			if (user.id === clan.owner.id) {
				isOwner = true;
			}
			if (user.clan_id === clan.id) {
				isMember = true;
			}

			// Check for pending request or invite
			const mysqlDB = await getMySQLDatabase();
			if (mysqlDB) {
				const invite = await mysqlDB('clan_invites')
					.where({ clan_id: clanId, user_id: user.id })
					.whereIn('status', ['pending', 'request_pending'])
					.first();
				if (invite) {
					hasPendingRequest = true;
				}
			}
		}
	}

	return {
		clan,
		isOwner,
		isMember,
		hasPendingRequest,
		currentUser,
		csrfToken: locals.csrfToken
	};
}
