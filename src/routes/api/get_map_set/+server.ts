import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase } from '../../../hooks.server';

export const GET: RequestHandler = async ({ url }) => {
	try {
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
			maps: maps.map(map => ({
				id: map.id,
				version: map.version,
				diff: map.diff,
				status: map.status,
				md5: map.md5
			}))
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to fetch beatmap set');
	}
};
