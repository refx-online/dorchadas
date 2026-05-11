import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { fetchPPProfileHistory } from '$lib/api';
import { withApiErrorHandling } from '$lib/server/http';
import { isNumber } from '$lib/string';

const validScopes = ['pp', 'rank', 'peak'] as const;

export const GET: RequestHandler = withApiErrorHandling(
	'Failed to fetch profile history',
	async ({ params, url }) => {
		const mode = url.searchParams.get('mode') ?? '0';
		const scope = url.searchParams.get('scope') ?? 'pp';

		if (!params.userId || !isNumber(params.userId) || !isNumber(mode)) {
			throw error(400, 'Invalid profile history request');
		}

		const modeId = Number(mode);
		if (modeId < 0 || modeId > 20 || !validScopes.includes(scope as (typeof validScopes)[number])) {
			throw error(400, 'Invalid profile history request');
		}

		const result = await fetchPPProfileHistory(
			scope as (typeof validScopes)[number],
			Number(params.userId),
			modeId
		);

		if (!result.ok) {
			throw error(result.error.status, result.error.message);
		}

		return json(result.value);
	}
);
