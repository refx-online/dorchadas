export const privsToGroups = (privs: number) => {
	const privGroups: number[] = [];
	for (const key in Privileges) {
		if (Object.prototype.hasOwnProperty.call(Privileges, key)) {
			const value = parseInt(Privileges[key]);
			if (hasPrivilege(privs, value)) privGroups.push(value);
		}
	}
	return privGroups.reverse();
};

export function hasPrivilege(playerPriv: number, priv: number) {
	return (playerPriv & priv) === priv;
}

export function isDonator(playerPriv: number): boolean {
	return (
		hasPrivilege(playerPriv, Privileges.SUPPORTER) || hasPrivilege(playerPriv, Privileges.PREMIUM)
	);
}

export const isStaff = (playerPriv?: number): boolean =>
	playerPriv !== undefined &&
	[
		Privileges.ADMINISTRATOR,
		Privileges.DEVELOPER,
		Privileges.MODERATOR,
		Privileges.NOMINATOR,
		Privileges.TOURNEY_MANAGER
	].some((priv) => hasPrivilege(playerPriv, priv));

export const canModifyMapStatus = (playerPriv?: number): boolean =>
	playerPriv !== undefined &&
	[Privileges.NOMINATOR, Privileges.DEVELOPER].some((priv) => hasPrivilege(playerPriv, priv));

export const isAdmin = (playerPriv?: number): boolean =>
	playerPriv !== undefined &&
	[
		Privileges.ADMINISTRATOR,
		Privileges.DEVELOPER,
		Privileges.MODERATOR // aint even admin
	].some((priv) => hasPrivilege(playerPriv, priv));

export const isRestricted = (playerPriv?: number): boolean =>
	playerPriv !== undefined && !hasPrivilege(playerPriv, Privileges.UNRESTRICTED);

/* https://github.com/osuAkatsuki/bancho.py/blob/master/app/constants/privileges.py#L13-L38 */
export enum Privileges {
	UNRESTRICTED = 1 << 0,
	VERIFIED = 1 << 1,
	WHITELISTED = 1 << 2,
	SUPPORTER = 1 << 4,
	PREMIUM = 1 << 5,
	ALUMNI = 1 << 7,
	TOURNEY_MANAGER = 1 << 10,
	NOMINATOR = 1 << 11,
	MODERATOR = 1 << 12,
	ADMINISTRATOR = 1 << 13,
	DEVELOPER = 1 << 14
}
