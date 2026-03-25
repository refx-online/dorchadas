import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';
import { findExistingImage, DATA_DIRECTORY } from '$lib/image';

export const GET = async ({ params }) => {
	const clanId = params.clanId;
	const flagDirectory = path.join(DATA_DIRECTORY, 'clan_flag');

	const imageInfo = findExistingImage(flagDirectory, parseInt(clanId));

	if (!imageInfo) {
		throw error(404, 'Clan flag not found');
	}

	const imageData = await readFile(imageInfo.path);
	return new Response(new Uint8Array(imageData), {
		status: 200,
		headers: {
			'Content-Type': imageInfo.contentType,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
