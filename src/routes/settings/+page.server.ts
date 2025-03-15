import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { fail, error } from '@sveltejs/kit';
import { getMySQLDatabase } from '../../hooks.server';
import { sendDiscordWebhookLog } from '$lib/api';
import { usernameRegex } from '$lib/regex';

export const load = async ({ cookies }) => {
    const sessionToken = cookies.get('sessionToken');
    if (!sessionToken) {
        redirect(302, '/signin');
    }

    const user = await getUserFromSession(sessionToken);
    if (!user) {
        redirect(302, '/signin');
    }

    return {
        user: {
            id: user.id,
            username: user.name
        }
    };
};

export const actions = {
    changeUsername: async ({ request, cookies }) => {
        const sessionToken = cookies.get('sessionToken');
        const user = await getUserFromSession(sessionToken);
        const mysqlDatabase = await getMySQLDatabase();
        const data = await request.formData();
        const newUsername = data.get('newUsername')?.toString().trim();

        if (!sessionToken) {
            return redirect(302, '/signin');
        }

        if (!user) {
            return redirect(302, '/signin');
        }

        if (!mysqlDatabase) {
            throw error(500, 'Database connection failed');
        }

        if (!newUsername) {
            return fail(400, { message: 'Username cannot be empty' });
        }

        // ensures the username is between 2-20 characters long
        // allows the first part of the username to consist of alphanumeric characters
        // allows optional groups of a space followed by alphanumeric characters
        if (!usernameRegex.test(newUsername)) {
            return fail(400, { message: 'Invalid username format' });
        }

        try {
            // username change are free on this server
            // so we need this check to prevent users from changing their names too quickly
            const lastNameChange = await mysqlDatabase
                .select('last_namechange')
                .from('users')
                .where('id', user.id)
                .first();

            const cd = 86400; // 24 hours
            const currentTime = Math.floor(Date.now() / 1000);

            if (currentTime - cd < lastNameChange.last_namechange) {
                const remainingSeconds = lastNameChange.last_namechange + cd - currentTime;
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                return fail(400, { message: `You're on timeout. ${hours.toString().padStart(2, '0')} hours ${minutes.toString().padStart(2, '0')} minutes left` });
            }

            // get existing user from the new username, 
            // if exist we throw username already taken
            const existingUser = await mysqlDatabase
                .select('id')
                .from('users')
                .where('name', newUsername)
                .first();

            if (existingUser) {
                return fail(400, { message: 'Username already taken' });
            }

            const safeName = newUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');

            // all checks are passed, update their username
            // if their old username exist, we remove
            await mysqlDatabase('username_log')
                .delete()
                .where('user_id', user.id)
                .andWhere('old_username', user.name);

            // insert their old username to username_log for logging
            await mysqlDatabase.raw(
                `INSERT INTO username_log (user_id, old_username, time)
                 VALUES (?, ?, NOW())`,
                [user.id, user.name]
            );

            // now we update the username with the last namechange time
            await mysqlDatabase('users')
                .where('id', user.id)
                .update({
                    name: newUsername,
                    safe_name: safeName,
                    last_namechange: currentTime
                });
            
            // TODO: make this a bit cooler
            sendDiscordWebhookLog('change name', `${user.name} (${user.id}) -> ${newUsername} (${user.id})`)

            return { success: true };
        } catch (error) {
            console.error('Username change error:', error);
            return fail(500, { message: 'An error occurred while updating username' });
        }
    }
};