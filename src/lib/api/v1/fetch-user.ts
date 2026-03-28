import { apiUrl } from '../../env';
import type {
	User,
	ppProfileHistory,
	rankProfileHistory,
	peakrankProfileHistory
} from '../../types';
import { handleFetch } from './common';
import { ok, err, type Result, ApiError } from '../../result';
import { logger } from '../../logger';

export const fetchPlayer = async (
	uid: number | string,
	scope: 'all' | 'info' | 'stats'
): Promise<Result<User, ApiError>> => {
	try {
		if (typeof uid === 'number' || /^\d+$/.test(uid.toString())) {
			const byId = await fetch(`${apiUrl}/v1/get_player_info?id=${uid}&scope=${scope}`);
			if (byId.ok) return ok((await byId.json()) as User);
		}

		const byName = await fetch(
			`${apiUrl}/v1/get_player_info?name=${encodeURIComponent(uid)}&scope=${scope}`
		);
		if (byName.ok) return ok((await byName.json()) as User);

		logger.error(`Error fetching player ${uid}: Not found or API error`);
		return err(new ApiError(404, 'Player not found'));
	} catch (error) {
		logger.error(`Error fetching player ${uid}`, error);
		return err(new ApiError(500, 'Failed to fetch player'));
	}
};

type ProfileHistoryResponse = ppProfileHistory | rankProfileHistory | peakrankProfileHistory;

export const fetchPPProfileHistory = async (
	scope: 'pp' | 'rank' | 'peak',
	uid: number | undefined,
	mode: number
): Promise<Result<ProfileHistoryResponse, ApiError>> => {
	if (!uid) return err(new ApiError(400, 'UID is required'));

	const result = await handleFetch<ProfileHistoryResponse>(
		`${apiUrl}/v1/get_player_history?scope=${scope}&id=${uid}&mode=${mode}`,
		`profile history (scope: ${scope}, uid: ${uid})`
	);

	return result;
};
