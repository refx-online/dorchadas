import { getMySQLDatabase, getRedisClient } from '../../../../hooks.server';
import type { DBUser } from '$lib/types';
import type { Actions } from '../../$types';
import { sendDiscordWebhookLog } from '$lib/api';
import { getUserFromSession } from '$lib/user';
import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/privs';

import { Privileges } from '$lib/privs';

import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function hashPassword(password: string) {
	const pw_md5 = crypto.createHash('md5')
		.update(password)
		.digest('hex');
	const pw_bcrypt = await bcrypt.hash(pw_md5, 10); // 10 salt rounds

	return pw_bcrypt;
}

export const actions: Actions = {
    updateUser: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));
        const field = data.get('field')?.toString();
        const value = data.get('value')?.toString();

        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        if (!userId || !field || value === undefined) {
            return { success: false, error: 'Missing required fields' };
        }

        if (field === 'name' && typeof value === 'string') {
            if (value.length < 3 || value.length > 20) {
                return { success: false, error: 'Username must be 3-20 characters' };
            }
        }

        const mysqlDatabase = await getMySQLDatabase();
        const user = await mysqlDatabase<DBUser>('users')
            .select('name', 'id')
            .where('id', userId)
            .first();

        // fuckass check :roses:
        if (field === 'name' && typeof value === 'string') {
            await mysqlDatabase<DBUser>('users')
                .where('id', userId)
                .update({ 
                    [field]: value,
                    safe_name: value.toLowerCase().replace(/[^a-z0-9]/g, '_')
                })
                .catch(err => {
                    console.error('updateUser error:', err);
                    throw err;
                });
        } else {
            await mysqlDatabase<DBUser>('users')
                .where('id', userId)
                .update({ [field]: value })
                .catch(err => {
                    console.error('updateUser error:', err);
                    throw err;
                });
        }

        await sendDiscordWebhookLog(
            'Nerv', 
            `${sessionUser?.name} (${sessionUser?.id}) updates ${user?.name} (${user?.id})'s ${field}!`,
            'https://refx.online/nerv.png'
        )

        return { success: true };
    },

    updatePassword: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));
        const newPass = data.get('newPassword')?.toString();

        if (!userId || newPass === undefined) {
            return { success: false, error: 'Missing required fields' };
        }

        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        // hash password
        const newPassword = await hashPassword(newPass);
        const mysqlDatabase = await getMySQLDatabase();
        const user = await mysqlDatabase<DBUser>('users')
            .select('name', 'id')
            .where('id', userId)
            .first();

        await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .update({ pw_bcrypt: newPassword });
        
        await sendDiscordWebhookLog(
            'Nerv', 
            `${sessionUser?.name} (${sessionUser?.id}) updates ${user?.name} (${user?.id})'s password!`,
            'https://refx.online/nerv.png'
        )
        return { success: true };
    },

    restrictUser: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));
        
        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        const mysqlDatabase = await getMySQLDatabase();
        const user = await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .first();

        const newPrivileges = user?.priv & ~Privileges.UNRESTRICTED;
        
        await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .update({ priv: newPrivileges });

        const newPriv =  await mysqlDatabase<DBUser>('users')
            .select('priv')
            .where('id', userId)
            .first();

        await sendDiscordWebhookLog(
            'Nerv',
            `${sessionUser?.name} (${sessionUser?.id}) restricted ${user?.name} (${user?.id})!`,
            'https://refx.online/nerv.png'
        );

        return { success: true, newPriv };
    },

    unrestrictUser: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));
        
        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        const mysqlDatabase = await getMySQLDatabase();
        
        const user = await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .first();

        const newPrivileges = user?.priv | Privileges.UNRESTRICTED;

        await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .update({ priv: newPrivileges });

        const newPriv =  await mysqlDatabase<DBUser>('users')
            .select('priv')
            .where('id', userId)
            .first();

        await sendDiscordWebhookLog(
            'Nerv',
            `${sessionUser?.name} (${sessionUser?.id}) unrestricted ${user?.name} (${user?.id})!`,
            'https://refx.online/nerv.png'
        );

        return { success: true, newPriv };
    },

    silenceUser: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));
        const duration = Number(data.get('duration')); // in hours
        const reason = data.get('reason')?.toString();
        
        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        if (!duration || !reason) {
            return { success: false, error: 'Duration and reason are required' };
        }

        const mysqlDatabase = await getMySQLDatabase();
        const user = await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .first();

        const silenceEnd = Math.floor(Date.now() / 1000) + (duration * 3600);
        
        await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .update({ 
                silence_end: silenceEnd,
            });

        await sendDiscordWebhookLog(
            'Nerv',
            `${sessionUser?.name} (${sessionUser?.id}) silenced ${user?.name} (${user?.id}) for ${duration} hours! Reason: ${reason}`,
            'https://refx.online/nerv.png'
        );

        return { success: true, silenceEnd };
    },

    unsilenceUser: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));
        
        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        const mysqlDatabase = await getMySQLDatabase();
        const user = await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .first();
        
        await mysqlDatabase<DBUser>('users')
            .where('id', userId)
            .update({ 
                silence_end: 0,
            });

        await sendDiscordWebhookLog(
            'Nerv',
            `${sessionUser?.name} (${sessionUser?.id}) unsilenced ${user?.name} (${user?.id})!`,
            'https://refx.online/nerv.png'
        );

        return { success: true };
    },

    wipeUser: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(data.get('userId'));

        const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
        if (!isAdmin(sessionUser?.priv)) {
            return { success: false, error: 'Insufficient privileges' };
        }

        const mysqlDatabase = await getMySQLDatabase();
        const redis = await getRedisClient();

        const user = await mysqlDatabase('users')
            .where('id', userId).first();
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        await mysqlDatabase.transaction(async trx => {
            await trx('stats')
                .where('id', userId)
                .update({
                    tscore: 0,
                    rscore: 0,
                    pp: 0,
                    plays: 0, // should playcount resets?
                    playtime: 0,
                    acc: 0.000,
                    max_combo: 0,
                    total_hits: 0,
                    replay_views: 0,
                    xh_count: 0,
                    x_count: 0,
                    sh_count: 0,
                    s_count: 0,
                    a_count: 0,
                    xp: 0
                });

            await trx('scores').where('userid', userId).del();
        });

        for (let mode = 0; mode <= 7; mode++) {
            await redis.zRem(`bancho:leaderboard:${mode}`, String(userId));
            await redis.zRem(`bancho:leaderboard:${mode}:${user.geoloc?.country?.acronym}`, String(userId));
        }        

        await sendDiscordWebhookLog(
            'Nerv',
            `${sessionUser?.name} (${sessionUser?.id}) wipes ${user?.name} (${user?.id})!`,
            'https://refx.online/nerv.png'
        );

        return { success: true };
    }
}

export async function load({ params, cookies }) {
    const sessionToken = cookies.get('sessionToken');
    if (!sessionToken) {
        redirect(302, '/signin');
    }

    const OurUser = await getUserFromSession(sessionToken);
    if (!OurUser) {
        redirect(302, '/signin');
    }

    // privileges check
    if (!isAdmin(OurUser.priv)) {
        return { success: false, error: 'Insufficient privileges' };
    }

    const mysqlDatabase = await getMySQLDatabase();
    const userId = params.userId;

    const user = await mysqlDatabase<DBUser>('users')
        .where('id', userId)
        .first();
    
    return { user };
}