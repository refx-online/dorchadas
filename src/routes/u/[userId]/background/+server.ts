import path from 'path';
import { existsSync } from 'fs';
import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';

const backgroundFolder = path.join(process.cwd(), '.data', 'background');

export async function GET({ params }) {
    const userId = params.userId;
    const coverPath = path.join(backgroundFolder, `${userId}.png`);

    if (!existsSync(coverPath)) {
        return error(404, 'Background not found');
    }

    const cover = await readFile(coverPath);
    return new Response(cover, {
        status: 200,
        headers: {
            'Content-Type': 'image/png'
        }
    });
}