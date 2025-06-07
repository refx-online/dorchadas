import { getBeatmap } from '$lib/api';
import { getMySQLDatabase } from '../../../hooks.server';

export async function load({ params }) {
	const beatmapId = params.beatmapId;
	if (!/^\d+$/.test(beatmapId)) return {};

	const db = await getMySQLDatabase();

	const beatmapRow = await db('maps')
		.select('set_id')
		.where('id', beatmapId)
		.first();

	if (!beatmapRow?.set_id) return {};

	const diffs = await db('maps')
		.select('id', 'version')
		.where('set_id', beatmapRow.set_id)
		.orderBy('diff', 'asc');

	const beatmap = await getBeatmap(parseInt(beatmapId));

	return {
		map: beatmap?.map,
		diffs
	};
}