import { json, error } from '@sveltejs/kit';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { getUserFromSession } from '$lib/user';

export const POST = async ({ request, cookies }) => {
    try {
        const sessionToken = cookies.get('sessionToken');
        if (!sessionToken) {
            return error(401, 'Not authenticated');
        }

        const user = await getUserFromSession(sessionToken);
        if (!user) {
            return error(401, 'Invalid session');
        }

        const formData = await request.formData();
        const file = formData.get('background') as File;

        if (!file) {
            return error(400, 'No file uploaded');
        }

        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return error(400, 'Invalid file type. Only JPEG and PNG are allowed.');
        }

        const maxFileSize = 5 * 1024 * 1024;
        if (file.size > maxFileSize) {
            return error(400, 'File size exceeds the 5 MB limit');
        }

        const bgDirectory = path.join(process.cwd(), '.data', 'background');

        try {
            await mkdir(bgDirectory, { recursive: true });
        } catch (mkdirError) {
            console.error('Failed to create background directory:', mkdirError);
            return error(500, 'Failed to create background directory');
        }

        const existingBgPath = path.join(bgDirectory, `${user.id}.png`);
        try {
            await unlink(existingBgPath);
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.error(`Failed to delete existing cover: ${existingBgPath}`, err);
            }
        }

        const backgroundPath = path.join(bgDirectory, `${user.id}.png`);
        const buffer = new Uint8Array(await file.arrayBuffer());
        await writeFile(backgroundPath, buffer);

        return json({
            success: true,
            user: {
                id: user.id
            }
        });
    } catch (err) {
        console.error('Background upload error:', err);
        return error(500, 'Failed to upload Background');
    }
};