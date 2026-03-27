import { error, json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { getClan } from '$lib/api';
import {
	validateImageFile,
	deleteExistingImages,
	saveProcessedImage,
	DATA_DIRECTORY,
	ensureDirectoryExists
} from '$lib/image';
import path from 'path';

export const POST = async ({ request, cookies, params }) => {
	try {
		const sessionToken = cookies.get('sessionToken');
		if (!sessionToken) {
			throw error(401, 'Not authenticated');
		}

		const user = await getUserFromSession(sessionToken);
		if (!user) {
			throw error(401, 'Invalid session');
		}

		const clanId = parseInt(params.clanId);
		if (isNaN(clanId)) {
			throw error(400, 'Invalid clan ID');
		}

		const clan = await getClan(clanId);
		if (!clan) {
			throw error(404, 'Clan not found');
		}

		if (user.clan_id !== clanId || user.clan_priv < 3) {
			throw error(403, 'Only the clan owner can change the flag');
		}

		const formData = await request.formData();
		const file = formData.get('flag') as File;

		await validateImageFile(file);

		const flagDirectory = path.join(DATA_DIRECTORY, 'clan_flag');
		await ensureDirectoryExists(flagDirectory);

		await deleteExistingImages(flagDirectory, clanId);
		const extension = await saveProcessedImage(file, flagDirectory, clanId);

		return json({ success: true, clan: { id: clanId, extension } });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to upload flag');
	}
};
