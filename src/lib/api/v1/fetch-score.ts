import { apiUrl } from '../../env';
import type { ScoreInfoResponse, PlayerScores } from '../../types';
import { handleFetch } from './common';
import type { Result, ApiError } from '../../result';

export const fetchScoresInfo = async (
	scoreId: number
): Promise<Result<ScoreInfoResponse, ApiError>> => {
	return handleFetch<ScoreInfoResponse>(
		`${apiUrl}/v1/get_score_info?id=${scoreId}`,
		`score info ${scoreId}`
	);
};

export const fetchPlayerScores = async (options: {
	userId: number;
	mode: number;
	limit: number;
	offset: number;
	includeLoved?: boolean;
	includeFailed?: boolean;
	scope: 'best' | 'recent' | 'first' | 'pinned';
}): Promise<Result<PlayerScores, ApiError>> => {
	return handleFetch<PlayerScores>(
		`${apiUrl}/v1/get_player_scores?id=${options.userId}&mode=${options.mode}&limit=${options.limit}&offset=${options.offset}&include_failed=${
			options.includeFailed ?? true
		}&include_loved=${options.includeLoved ?? false}&scope=${options.scope}`,
		`player scores for ${options.userId}`
	);
};
