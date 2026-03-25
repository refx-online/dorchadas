import { apiUrl } from './env';
import type {
	Clan,
	getScoreInfo,
	MapInfo,
	MapScores,
	PlayerCounts,
	PlayerMostPlayed,
	PlayerScores,
	PlayerStatus,
	ppProfileHistory,
	rankProfileHistory,
	peakrankProfileHistory,
	User
} from './types';

const handleFetch = async <T>(url: string, description: string): Promise<T | undefined> => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(`Error fetching ${description}: ${response.status} ${response.statusText}`);
			return undefined;
		}
		return (await response.json()) as T;
	} catch (error) {
		console.error(`Error fetching ${description}:`, error);
		return undefined;
	}
};

export const getClan = async (clanId: number): Promise<Clan | undefined> => {
	return handleFetch<Clan>(`${apiUrl}/v1/get_clan?id=${clanId}`, `clan ${clanId}`);
};

export const getBeatmap = async (beatmapId: number): Promise<MapInfo | undefined> => {
	return handleFetch<MapInfo>(`${apiUrl}/v1/get_map_info?id=${beatmapId}`, `beatmap ${beatmapId}`);
};

export const getBeatmapMd5 = async (hash: string): Promise<MapInfo | undefined> => {
	return handleFetch<MapInfo>(`${apiUrl}/v1/get_map_info?md5=${hash}`, `beatmap md5 ${hash}`);
};

export const getScoresInfo = async (scoreId: number): Promise<getScoreInfo | undefined> => {
	return handleFetch<getScoreInfo>(
		`${apiUrl}/v1/get_score_info?id=${scoreId}`,
		`score info ${scoreId}`
	);
};

export const getBeatmapScores = async (opts: {
	beatmapMd5: string;
	mode: number;
	scope: 'best' | 'recent';
}): Promise<MapScores | undefined> => {
	return handleFetch<MapScores>(
		`${apiUrl}/v1/get_map_scores?md5=${opts.beatmapMd5}&mode=${opts.mode}&limit=50&scope=${opts.scope}`,
		`beatmap scores for ${opts.beatmapMd5}`
	);
};

export const getPlayerScores = async (opts: {
	userId: number;
	mode: number;
	limit: number;
	offset: number;
	includeLoved?: boolean;
	includeFailed?: boolean;
	scope: 'best' | 'recent' | 'first' | 'pinned';
}): Promise<PlayerScores | undefined> => {
	return handleFetch<PlayerScores>(
		`${apiUrl}/v1/get_player_scores?id=${opts.userId}&mode=${opts.mode}&limit=${opts.limit}&offset=${opts.offset}&include_failed=${
			opts.includeFailed ?? true
		}&include_loved=${opts.includeLoved ?? false}&scope=${opts.scope}`,
		`player scores for ${opts.userId}`
	);
};

export const getPlayerMostPlayed = async (opts: {
	userId: number;
	mode: number;
	limit: number;
}): Promise<PlayerMostPlayed | undefined> => {
	return handleFetch<PlayerMostPlayed>(
		`${apiUrl}/v1/get_player_most_played?id=${opts.userId}&mode=${opts.mode}&limit=${opts.limit}`,
		`player most played for ${opts.userId}`
	);
};

export const getPlayerCounts = async (): Promise<PlayerCounts | undefined> => {
	return handleFetch<PlayerCounts>(`${apiUrl}/v1/get_player_count`, 'player counts');
};

export const getPlayerStatus = async (uid: number): Promise<PlayerStatus | undefined> => {
	return handleFetch<PlayerStatus>(
		`${apiUrl}/v1/get_player_status?id=${uid}`,
		`player status ${uid}`
	);
};

export const getPlayer = async (
	uid: number | string,
	scope: 'all' | 'info' | 'stats'
): Promise<User | undefined> => {
	try {
		if (typeof uid === 'number' || /^\d+$/.test(uid)) {
			const byId = await fetch(`${apiUrl}/v1/get_player_info?id=${uid}&scope=${scope}`);
			if (byId.ok) return (await byId.json()) as User;
		}

		const byName = await fetch(
			`${apiUrl}/v1/get_player_info?name=${encodeURIComponent(uid)}&scope=${scope}`
		);
		if (byName.ok) return (await byName.json()) as User;

		console.error(`Error fetching player ${uid}: Not found or API error`);
		return undefined;
	} catch (error) {
		console.error(`Error fetching player ${uid}:`, error);
		return undefined;
	}
};

type ProfileHistoryResponse = ppProfileHistory | rankProfileHistory | peakrankProfileHistory;

export const getPPProfileHistory = async (
	scope: 'pp' | 'rank' | 'peak',
	uid: number | undefined,
	mode: number
): Promise<ProfileHistoryResponse | undefined> => {
	if (!uid) return undefined;

	const data = await handleFetch<any>(
		`${apiUrl}/v1/get_player_history?scope=${scope}&id=${uid}&mode=${mode}`,
		`profile history (scope: ${scope}, uid: ${uid})`
	);

	if (!data) return undefined;

	switch (scope) {
		case 'pp':
			return data as ppProfileHistory;
		case 'rank':
			return data as rankProfileHistory;
		case 'peak':
			return data as peakrankProfileHistory;
		default:
			return undefined;
	}
};
