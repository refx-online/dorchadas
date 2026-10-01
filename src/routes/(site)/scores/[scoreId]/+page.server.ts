import { fetchScoresInfo, fetchBeatmapMd5, fetchPlayer, fetchClan } from '$lib/api';

export async function load({ params }) {
	const scoreId = params.scoreId;
	if (!/^\d+$/.test(scoreId)) return {};

	const scoreResult = await fetchScoresInfo(parseInt(scoreId));
	if (!scoreResult.ok) return {};
	const score = scoreResult.value.score;

	const playerResult = await fetchPlayer(score.userid, 'all');
	if (!playerResult.ok || !playerResult.value.player) return {};
	const player = playerResult.value.player;

	const clanResult = await fetchClan(player.info.clan_id);
	const clan = clanResult.ok ? clanResult.value : undefined;
	const clanName = clan?.tag ? `[${clan.tag}]` : '';

	const beatmapResult = await fetchBeatmapMd5(score.map_md5);
	const beatmap = beatmapResult.ok ? beatmapResult.value.map : undefined;

	return {
		score,
		player: player.info,
		beatmap,
		clan: clanName,
		clanData: clan
	};
}
