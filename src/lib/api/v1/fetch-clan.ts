import { apiUrl } from '../../env';
import type { Clan } from '../../types';
import { handleFetch } from './common';
import type { Result, ApiError } from '../../result';

export const fetchClan = async (clanId: number): Promise<Result<Clan, ApiError>> => {
	return handleFetch<Clan>(`${apiUrl}/v1/get_clan?id=${clanId}`, `clan ${clanId}`);
};
