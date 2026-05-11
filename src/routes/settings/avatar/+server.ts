import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { env } from '$env/dynamic/private';
import { validateImageFile, deleteExistingImages, saveImageFile } from '$lib/image';
import { withApiErrorHandling } from '$lib/server/http';

export const POST = withApiErrorHandling(
	'Failed to upload avatar',
	async ({ request, cookies }) => {
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
		if (!avatarDirectory) {
			throw error(500, 'Avatar directory not configured');
		}

		await deleteExistingImages(avatarDirectory, user.id);
		await saveImageFile(file, avatarDirectory, user.id);

		return json({ success: true, user: { id: user.id } });
	}
);
