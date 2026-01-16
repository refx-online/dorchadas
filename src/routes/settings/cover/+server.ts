import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import path from 'path';
import { validateImageFile, deleteExistingImages, saveImageFile, ensureDirectoryExists, DATA_DIRECTORY } from '$lib/image';

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
        const file = formData.get('cover') as File;

        await validateImageFile(file);

        const coverDirectory = path.join(DATA_DIRECTORY, 'cover');
        await ensureDirectoryExists(coverDirectory);
        await deleteExistingImages(coverDirectory, user.id);
        await saveImageFile(file, coverDirectory, user.id);

        return json({ success: true, user: { id: user.id } });
    } catch (err) {
        console.error('Cover upload error:', err);
        throw error(500, 'Failed to upload cover');
    }
};
