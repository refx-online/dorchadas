import { getUserFromSession } from '$lib/user';

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (sessionToken) {
		const user = await getUserFromSession(sessionToken);
		if (user) {
			return {
				currentUser: {
					id: user.id,
					username: user.name,
					clanId: user.clan_id
				}
			};
		}
	}

	return {
		currentUser: null
	};
};
