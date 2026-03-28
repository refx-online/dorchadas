import { apiUrl } from '../../env';
import type { MapInfo, MapScores, PlayerMostPlayed } from '../../types';
import { handleFetch } from './common';
import type { Result, ApiError } from '../../result';

export const fetchBeatmap = async (beatmapId: number): Promise<Result<MapInfo, ApiError>> => {
	return handleFetch<MapInfo>(`${apiUrl}/v1/get_map_info?id=${beatmapId}`, `beatmap ${beatmapId}`);
};

export const fetchBeatmapMd5 = async (hash: string): Promise<Result<MapInfo, ApiError>> => {
	return handleFetch<MapInfo>(`${apiUrl}/v1/get_map_info?md5=${hash}`, `beatmap md5 ${hash}`);
};

export const fetchBeatmapScores = async (options: {
	beatmapMd5: string;
	mode: number;
	scope: 'best' | 'recent';
}): Promise<Result<MapScores, ApiError>> => {
	return handleFetch<MapScores>(
		`${apiUrl}/v1/get_map_scores?md5=${options.beatmapMd5}&mode=${options.mode}&limit=50&scope=${options.scope}`,
		`beatmap scores for ${options.beatmapMd5}`
	);
};

export const fetchPlayerMostPlayed = async (options: {
	userId: number;
	mode: number;
	limit: number;
}): Promise<Result<PlayerMostPlayed, ApiError>> => {
	return handleFetch<PlayerMostPlayed>(
		`${apiUrl}/v1/get_player_most_played?id=${options.userId}&mode=${options.mode}&limit=${options.limit}`,
		`player most played for ${options.userId}`
	);
};
