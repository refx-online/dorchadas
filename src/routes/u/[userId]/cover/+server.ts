import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';
import { findExistingImage } from '$lib/image';

export const GET = async ({ params }) => {
    const userId = params.userId;
    const coverDirectory = path.join(process.cwd(), '.data', 'cover');
    
    const imageInfo = findExistingImage(coverDirectory, parseInt(userId));
    
    if (!imageInfo) {
        throw error(404, 'Cover not found');
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
