import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { env } from '$env/dynamic/private';
import { validateImageFile, deleteExistingImages, saveImageFile } from '$lib/image';

export const POST = async ({ request, cookies }) => {
	try {
		const sessionToken = cookies.get('sessionToken');
		if (!sessionToken) {
			throw error(401, 'Not authenticated');
		}

		const user = await getUserFromSession(sessionToken);
		if (!user) {
			throw error(401, 'Invalid session');
		}

		const formData = await request.formData();
		const file = formData.get('avatar') as File;

		await validateImageFile(file);

		const avatarDirectory = env.AVATAR_DIRECTORY;
		await deleteExistingImages(avatarDirectory, user.id);
		await saveImageFile(file, avatarDirectory, user.id);

		return json({ success: true, user: { id: user.id } });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to upload avatar');
	}
};
