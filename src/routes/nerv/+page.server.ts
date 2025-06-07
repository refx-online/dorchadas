import { getPlayerCounts } from '$lib/api';
import { getMySQLDatabase } from '../../hooks.server';
import type { DBUser } from '$lib/types';

import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { isStaff, Privileges } from '$lib/privs';

export const load = async ({ cookies }) => {
    const sessionToken = cookies.get('sessionToken');
    if (!sessionToken) {
        redirect(302, '/signin');
    }

    const OurUser = await getUserFromSession(sessionToken);
    if (!OurUser) {
        redirect(302, '/signin');
    }

    // privileges check
    if (!isStaff(OurUser.priv)) {
        redirect(400, '/home');
    }

    const userCounts = await getPlayerCounts();
    const mysqlDatabase = await getMySQLDatabase();

    const recentAccounts = await mysqlDatabase('users')
        .select('id', 'name', 'creation_time')
        .where('priv', '&', 1 << 1)
        .orderBy('creation_time', 'desc')
        .limit(10);

    const rankedMapsCount = await mysqlDatabase('maps')
        .where('status', '=', 2)
        .count('* as count')
        .first()
        .then(result => result ? result.count : 0);

    const restrictedAccountsCount = await mysqlDatabase('users')
        .whereRaw('priv & ? = 0', [Privileges.UNRESTRICTED])
        .count('* as count')
        .first()
        .then(result => result ? result.count : 0);

    const totalPP = await mysqlDatabase('scores')
        .sum('pp as total')
        .first()
        .then(result => result?.total ?? 0);

    const scoreCount = await mysqlDatabase('scores')
        .count('* as count')
        .first()
        .then(result => result?.count ?? 0);

    const totalPlays = await mysqlDatabase('stats')
        .sum('plays as total')
        .first()
        .then(result => result?.total ?? 0);
    
    return {
        userCounts,
        recentAccounts,
        rankedMapsCount,
        restrictedAccountsCount,
        totalPP,
        scoreCount,
        totalPlays,

        OurUser
    };
};