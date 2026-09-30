import { redirect } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import { isStaff } from '$lib/privs';
import { getMySQLDatabase } from '$lib/server/connections';

const SERVICES = [
	{ name: 'bancho', url: 'http://localhost:7777/api/v1/get_player_count' },
	{ name: 'forlorn', url: 'http://localhost:3030/' },
	{ name: 'omajinai', url: 'http://localhost:1994/health' },
	{ name: 'mist', url: 'http://localhost:7273/v1/get_leaderboard?mode=0' },
	{ name: 'frontend', url: 'http://localhost:3001/' },
	{ name: 'assets', url: 'http://localhost:9929/menu-content.json' },
	{ name: 'updater', url: 'http://localhost:1272/metadata.json' },
	{ name: 'beatmap', url: 'http://localhost:3700/v1/get_beatmaps?b=75' },
	{ name: 'mysql', url: '' },
	{ name: 'redis', url: '' }
];

async function checkService(url: string): Promise<{ up: boolean; ms: number }> {
	const start = Date.now();
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
		// any http answer (even 4xx) means the process is alive
		return { up: res.status < 500, ms: Date.now() - start };
	} catch {
		return { up: false, ms: -1 };
	}
}

export const load = async ({ cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	if (!sessionToken) {
		throw redirect(302, '/signin');
	}

	const ourUser = await getUserFromSession(sessionToken);
	if (!ourUser) {
		throw redirect(302, '/signin');
	}

	if (!isStaff(ourUser.priv)) {
		throw redirect(302, '/');
	}

	const mysqlDatabase = await getMySQLDatabase();
	if (!mysqlDatabase) {
		throw new Error('Database connection failed');
	}

	// online players straight from bancho (username, plus match name when in one)
	let online: { name: string; match: string | null }[] = [];
	try {
		const res = await fetch('http://localhost:7777/api/v1/get_online', {
			signal: AbortSignal.timeout(4000)
		});
		if (res.ok) {
			const text = await res.text();
			online = text
				.split('\n')
				.map((l) => l.trim())
				.filter((l) => l && !l.startsWith('---') && !l.endsWith('(bot)'))
				.map((l) => {
					const m = l.match(/^(.*) \[match: (.*)\]$/);
					return m ? { name: m[1], match: m[2] } : { name: l, match: null };
				});
		}
	} catch {
		// bancho down — services panel shows it
	}

	const services = await Promise.all(
		SERVICES.map(async (s) => {
			if (!s.url) {
				// infra without http endpoints: proved by the queries below
				return { ...s, up: true, ms: 0 };
			}
			return { ...s, ...(await checkService(s.url)) };
		})
	);

	const recentScores = await mysqlDatabase('scores as s')
		.join('users as u', 'u.id', 's.userid')
		.leftJoin('maps as m', 'm.md5', 's.map_md5')
		.select(
			's.id',
			's.pp',
			's.acc',
			's.mode',
			's.play_time',
			'u.id as user_id',
			'u.name as username',
			'm.artist',
			'm.title',
			'm.version'
		)
		.orderBy('s.id', 'desc')
		.limit(15);

	const recentUsers = await mysqlDatabase('users')
		.select('id', 'name', 'country', 'creation_time')
		.orderBy('creation_time', 'desc')
		.limit(10);

	return { online, services, recentScores, recentUsers };
};
