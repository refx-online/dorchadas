import { fetchTopScores, fetchTopScoresCount } from '$lib/db';
import { error } from '@sveltejs/kit';

export async function load({ url }) {
	const modeParam = url.searchParams.get('mode') ?? '0';
	const pageParam = url.searchParams.get('page') ?? '1';

	const mode = parseInt(modeParam);
	const page = parseInt(pageParam);

	if (isNaN(mode) || isNaN(page)) {
		error(400, 'Invalid mode or page');
	}

	const limit = 45;
	const offset = (page - 1) * limit;

	const [scoresResult, totalScoresResult] = await Promise.all([
		fetchTopScores({ mode, limit, offset }),
		fetchTopScoresCount(mode)
	]);

	const scores = scoresResult.ok ? scoresResult.value : [];
	const totalScores = totalScoresResult.ok ? totalScoresResult.value : 0;
	const totalPages = Math.ceil(totalScores / limit);

	return {
		scores,
		mode,
		page,
		totalPages
	};
}
