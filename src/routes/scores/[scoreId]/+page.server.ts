import { getScoresInfo, getBeatmapMd5, getPlayer, getClan } from '$lib/api';

export async function load({ params }) {
	const scoreId = params.scoreId;
	if (!/^\d+$/.test(scoreId)) return {};

	const scoreInfo = await getScoresInfo(parseInt(scoreId));
	if (!scoreInfo) return {};

	const player = await getPlayer(scoreInfo?.score.userid, 'all');
	if (!player || !player.player) return {};

	const clan = await getClan(player?.player.info.clan_id);

	const clanName = clan?.tag ? `[${clan.tag}]` : '';

	const beatmap = await getBeatmapMd5(scoreInfo?.score.map_md5);

	return {
		score: scoreInfo?.score,
		player: player?.player?.info,
		beatmap: beatmap?.map,
		clan: clanName
	};
}
