import { json } from '@sveltejs/kit';
import { fetchClans } from '$lib/db';

export async function POST({ url }) {
	const searchParams = url.searchParams;

	const limit = parseInt(searchParams.get('limit') ?? '50');
	const offset = parseInt(searchParams.get('offset') ?? '0');
	const mode = parseInt(searchParams.get('mode') ?? '0');

	if (isNaN(limit)) return json({ code: 403, message: 'Invalid limit' });
	if (isNaN(offset)) return json({ code: 403, message: 'Invalid offset' });
	if (isNaN(mode)) return json({ code: 403, message: 'Invalid mode' });

	const result = await fetchClans({
		limit: limit,
		mode: mode,
		offset: offset
	});

	if (result.ok) {
		return json(result.value);
	} else {
		return json({ code: 500, message: result.error.message }, { status: 500 });
	}
}
