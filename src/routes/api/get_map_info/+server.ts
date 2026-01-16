import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase } from '../../../hooks.server';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) {
			throw error(500, 'Database connection failed');
		}

		const beatmapId = url.searchParams.get('id');
		const md5 = url.searchParams.get('md5');

		if (!beatmapId && !md5) {
			throw error(400, 'Either id or md5 parameter is required');
		}

		let beatmap: any;

		if (beatmapId) {
			const id = parseInt(beatmapId, 10);
			if (isNaN(id)) {
				throw error(400, 'Invalid beatmap ID');
			}
			beatmap = await mysqlDB('maps')
				.where('id', id)
				.first();
		} else if (md5) {
			beatmap = await mysqlDB('maps')
				.where('md5', md5)
				.first();
		}

		if (!beatmap) {
			throw error(404, 'Beatmap not found');
		}

		return json({
			status: 'success',
			map: {
				md5: beatmap.md5,
				id: beatmap.id,
				set_id: beatmap.set_id,
				artist: beatmap.artist,
				title: beatmap.title,
				version: beatmap.version,
				creator: beatmap.creator,
				last_update: beatmap.last_update,
				total_length: beatmap.total_length,
				max_combo: beatmap.max_combo,
				status: beatmap.status,
				plays: beatmap.plays,
				passes: beatmap.passes,
				mode: beatmap.mode,
				bpm: beatmap.bpm,
				cs: beatmap.cs,
				od: beatmap.od,
				ar: beatmap.ar,
				hp: beatmap.hp,
				diff: beatmap.diff
			}
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to fetch beatmap information');
	}
};
