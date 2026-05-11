import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase } from '$lib/server/connections';
import { withApiErrorHandling } from '$lib/server/http';

export const GET: RequestHandler = withApiErrorHandling(
	'Failed to fetch beatmap set',
	async ({ url }) => {
		const mysqlDB = await getMySQLDatabase();
		if (!mysqlDB) {
			throw error(500, 'Database connection failed');
		}

		const setId = url.searchParams.get('set_id');
		if (!setId) {
			throw error(400, 'set_id parameter is required');
		}

		const setIdNum = parseInt(setId, 10);
		if (isNaN(setIdNum)) {
			throw error(400, 'Invalid set_id');
		}

		const maps = await mysqlDB('maps')
			.select('id', 'version', 'diff', 'status', 'md5')
			.where('set_id', setIdNum)
			.orderBy('diff', 'asc');

		return json({
			status: 'success',
			maps: maps.map((map) => ({
				id: map.id,
				version: map.version,
				diff: map.diff,
				status: map.status,
				md5: map.md5
			}))
		});
	}
);
