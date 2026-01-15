import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import path from 'path';
import { validateImageFile, deleteExistingImages, saveImageFile, ensureDirectoryExists } from '$lib/image';

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
        const file = formData.get('background') as File;
        
        await validateImageFile(file);

        const bgDirectory = path.join(process.cwd(), '.data', 'background');
        await ensureDirectoryExists(bgDirectory);
        await deleteExistingImages(bgDirectory, user.id);
        await saveImageFile(file, bgDirectory, user.id);

        return json({ success: true, user: { id: user.id } });
    } catch (err) {
        console.error('Background upload error:', err);
        throw error(500, 'Failed to upload background');
    }
};
