import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getMySQLDatabase, getRedisClient } from '../../../../hooks.server';
import { getUserFromSession } from '$lib/user';
import { isStaff } from '$lib/privs';
import { RankedStatus, statusStringToId } from '$lib/beatmapStatus';
import { getPlayerStatus } from '$lib/api';
import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';

const REFX_REFRESH_CHANNEL = 'refx:refresh_bmap_cache';
const FORLORN_REFRESH_CHANNEL = 'forlorn:refresh_map';

interface BeatmapRankRequest {
	status: string;
	scope: 'map' | 'set';
	beatmapId?: number;
}

const formatLength = (seconds: number): string => {
	if (typeof seconds !== 'number' || isNaN(seconds)) {
		return '??:??';
	}
	if (seconds >= 3600) {
		const hours = Math.floor(seconds / 3600) % 24;
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	const minutes = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getStatusString = (status: RankedStatus): string => {
	switch (status) {
		case RankedStatus.Inactive:
			return 'Inactive';
		case RankedStatus.NotSubmitted:
			return 'Not Submitted';
		case RankedStatus.Pending:
			return 'Pending';
		case RankedStatus.UpdateAvailable:
			return 'Update Available';
		case RankedStatus.Ranked:
			return 'Ranked';
		case RankedStatus.Approved:
			return 'Approved';
		case RankedStatus.Qualified:
			return 'Qualified';
		case RankedStatus.Loved:
			return 'Loved';
		default:
			return 'Unknown';
	}
};

const getEmbedColor = (status: RankedStatus): number => {
	switch (status) {
		case RankedStatus.Ranked:
		case RankedStatus.Approved:
		case RankedStatus.Qualified:
			return 0x6BCEFF; // cyan
		case RankedStatus.Loved:
			return 0xFF66AA; // pink
		default:
			return 0x808080; // grey
	}
};

const sendDiscordWebhook = async (beatmap: any, user: any, newStatus: RankedStatus) => {
	const webhookUrl = env.DISCORD_RANK_WEBHOOK;
	if (!webhookUrl) {
		return;
	}

	const statusString = getStatusString(newStatus);
	const color = getEmbedColor(newStatus);

	const title = `${beatmap.artist} - ${beatmap.title} [${beatmap.version}] ${beatmap.diff.toFixed(2)}★`;
	const description = `cs: ${beatmap.cs} od: ${beatmap.od} ar: ${beatmap.ar} hp: ${beatmap.hp} length: ${formatLength(beatmap.total_length)}`;
	const url = `${pubEnv.PUBLIC_APP_URL}/beatmaps/${beatmap.id}`;

	const embed = {
		title,
		description,
		url,
		color,
		author: {
			name: `${user.name} changed map status to ${statusString}!`,
			url: `${pubEnv.PUBLIC_APP_URL}/u/${user.id}`,
			icon_url: `${pubEnv.PUBLIC_AVATAR_URL}/${user.id}`
		},
		footer: {
			text: `mapped by ${beatmap.creator} | nerv`
		},
		image: {
			url: `https://b.refx.online/cover/${beatmap.set_id}`
		}
	};

	try {
		await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ embeds: [embed] })
		});
	} catch {}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
		if (!sessionUser || !isStaff(sessionUser.priv)) {
			throw error(403, 'Unauthorized: Staff permission required');
		}

		const body: BeatmapRankRequest = await request.json();
		const { status, scope, beatmapId } = body;

		if (!status || !scope || (scope !== 'map' && scope !== 'set')) {
			throw error(400, 'Status and scope (map or set) are required');
		}

		const newStatus = statusStringToId(status);
		const mysqlDB = await getMySQLDatabase();
		const redis = await getRedisClient();

		if (!mysqlDB) {
			throw error(500, 'Database connection failed');
		}

		let beatmap: any;

		if (beatmapId) {
			beatmap = await mysqlDB('maps').where('id', beatmapId).first();
		} else {
			const playerStatus = await getPlayerStatus(sessionUser.id);
			if (!playerStatus?.player_status?.status?.beatmap) {
				throw error(
					400,
					'No beatmap found. Please specify beatmapId or ensure you have a beatmap loaded.'
				);
			}
			const lastNpBeatmap = playerStatus.player_status.status.beatmap;
			beatmap = await mysqlDB('maps').where('id', lastNpBeatmap.id).first();
		}

		if (!beatmap) {
			throw error(404, 'Beatmap not found');
		}

		if (scope === 'map') {
			if (beatmap.status === newStatus) {
				return json({
					status: 'success',
					message: `Beatmap ${beatmap.id} is already ${status}!`
				});
			}
		} else {
			const setMaps = await mysqlDB('maps').where('set_id', beatmap.set_id).select('id', 'status');

			if (setMaps.every((map: any) => map.status === newStatus)) {
				return json({
					status: 'success',
					message: `All maps from the set are already ${status}!`
				});
			}
		}

		await mysqlDB.transaction(async (trx) => {
			let modifiedBeatmapIds: number[] = [];

			if (scope === 'set') {
				await trx('maps').where('set_id', beatmap.set_id).update({
					status: newStatus,
					frozen: 1
				});

				const allSetMaps = await trx('maps').where('set_id', beatmap.set_id).select('id');

				modifiedBeatmapIds = allSetMaps.map((map: any) => map.id);
			} else {
				await trx('maps').where('id', beatmap.id).update({
					status: newStatus,
					frozen: 1
				});

				modifiedBeatmapIds = [beatmap.id];
			}

			if (modifiedBeatmapIds.length > 0) {
				await trx('map_requests').whereIn('map_id', modifiedBeatmapIds).update({ active: 0 });
			}
		});

		await mysqlDB('scores').where('map_md5', beatmap.md5).update({ map_status: newStatus });

		if (redis) {
			if (scope === 'set') {
				const setMaps = await mysqlDB('maps').where('set_id', beatmap.set_id).select('id');

				for (const map of setMaps) {
					await redis.publish(REFX_REFRESH_CHANNEL, `${map.id}|${newStatus}`);
				}
			} else {
				await redis.publish(REFX_REFRESH_CHANNEL, `${beatmap.id}|${newStatus}`);
			}

			await redis.publish(FORLORN_REFRESH_CHANNEL, beatmap.md5);
		}

		const updatedBeatmap = await mysqlDB('maps').where('id', beatmap.id).first();

		await sendDiscordWebhook(updatedBeatmap, sessionUser, newStatus);

		return json({
			status: 'success',
			message: `Beatmap ${beatmap.id} updated to ${status}.`,
			beatmap: {
				id: updatedBeatmap.id,
				status: updatedBeatmap.status
			}
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to update beatmap status');
	}
};
