import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import path from 'path';
import {
	validateImageFile,
	deleteExistingImages,
	saveImageFile,
	ensureDirectoryExists,
	DATA_DIRECTORY
} from '$lib/image';
import { withApiErrorHandling } from '$lib/server/http';

export const POST = withApiErrorHandling(
	'Failed to upload background',
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
		const file = formData.get('background') as File;

		await validateImageFile(file);

		const bgDirectory = path.join(DATA_DIRECTORY, 'background');
		await ensureDirectoryExists(bgDirectory);
		await deleteExistingImages(bgDirectory, user.id);
		await saveImageFile(file, bgDirectory, user.id);

		return json({ success: true, user: { id: user.id } });
	}
);
