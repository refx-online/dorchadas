import { apiUrl } from '../../env';
import { logger } from '../../logger';
import { ok, err, type Result, ApiError } from '../../result';

export const handleFetch = async <T>(
	url: string,
	description: string
): Promise<Result<T, ApiError>> => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			logger.error(`Error fetching ${description}: ${response.status} ${response.statusText}`);
			return err(new ApiError(response.status, `Failed to fetch ${description}`));
		}
		return ok((await response.json()) as T);
	} catch (error) {
		logger.error(`Error fetching ${description}`, error);
		return err(new ApiError(500, `Internal error fetching ${description}`));
	}
};
