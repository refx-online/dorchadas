import { apiUrl } from '../../env';
import type { PlayerCounts, PlayerStatus } from '../../types';
import { handleFetch } from './common';
import type { Result, ApiError } from '../../result';

export const fetchPlayerCounts = async (): Promise<Result<PlayerCounts, ApiError>> => {
	return handleFetch<PlayerCounts>(`${apiUrl}/v1/get_player_count`, 'player counts');
};

export const fetchPlayerStatus = async (uid: number): Promise<Result<PlayerStatus, ApiError>> => {
	return handleFetch<PlayerStatus>(
		`${apiUrl}/v1/get_player_status?id=${uid}`,
		`player status ${uid}`
	);
};
