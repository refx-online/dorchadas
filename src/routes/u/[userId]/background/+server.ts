import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';
import { findExistingImage, DATA_DIRECTORY } from '$lib/image';

export const GET = async ({ params }) => {
    const userId = params.userId;
    const bgDirectory = path.join(DATA_DIRECTORY, 'background');
    
    const imageInfo = findExistingImage(bgDirectory, parseInt(userId));
    
    if (!imageInfo) {
        throw error(404, 'Background not found');
    }

    const imageData = await readFile(imageInfo.path);
    return new Response(imageData, {
        status: 200,
        headers: {
            'Content-Type': imageInfo.contentType,
            'Cache-Control': 'public, max-age=3600'
        }
    });
};