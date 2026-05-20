import { redirect } from '@sveltejs/kit';
import { Privileges, hasPrivilege } from '$lib/privs';

export async function load({ parent }) {
	const { currentUser } = await parent();

	if (!currentUser) throw redirect(302, '/signin');

	const isNotNew =
		hasPrivilege(currentUser.priv, Privileges.UNRESTRICTED) &&
		hasPrivilege(currentUser.priv, Privileges.VERIFIED);

	if (isNotNew) throw redirect(302, '/');
}
