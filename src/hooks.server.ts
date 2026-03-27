import type { Handle } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { generateCsrfToken, validateCsrfToken, storeCsrfToken } from '$lib/csrf';
import { env } from '$env/dynamic/private';
import { makeid } from '$lib/stringUtil';
import chalk from 'chalk';
import knex_pkg from 'knex';
import redis from 'redis';

const { knex } = knex_pkg;

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_ID_COOKIE_NAME = 'csrf_id';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

let mysqlDatabase: knex_pkg.Knex | undefined;
let redisClient:
	| redis.RedisClientType<
			redis.RedisDefaultModules & redis.RedisModules,
			redis.RedisFunctions,
			redis.RedisScripts
	  >
	| undefined;

let mysqlConnected = false;
let redisConnected = false;

export const getMySQLDatabase = async (): Promise<knex_pkg.Knex | null> => {
	if (mysqlDatabase && mysqlConnected) return mysqlDatabase;

	try {
		console.log(chalk.gray('Connecting to MySQL database...'));
		const tempMysqlDatabase = knex({
			client: 'mysql2',
			connection: {
				host: env.MYSQL_HOST,
				user: env.MYSQL_USER,
				password: env.MYSQL_PASSWORD,
				database: env.MYSQL_DATABASE
			}
		});
		await tempMysqlDatabase.raw('SELECT 1 + 1 as connection_test;');
		console.log(chalk.green('Connected to MySQL database!'));
		mysqlConnected = true;

		return (mysqlDatabase = tempMysqlDatabase);
	} catch {
		mysqlConnected = false;
		return null;
	}
};

export const getRedisClient = async (): Promise<redis.RedisClientType<
	redis.RedisDefaultModules & redis.RedisModules,
	redis.RedisFunctions,
	redis.RedisScripts
> | null> => {
	if (redisClient && redisConnected) return redisClient;

	const redisUser = env.REDIS_USER ?? undefined;
	const redisPassword = env.REDIS_PASSWORD ?? undefined;
	const redisHost = env.REDIS_HOST ?? '127.0.0.1';
	const redisPort = env.REDIS_PORT ?? 6379;
	const redisDb = env.REDIS_DB ?? 0;

	//do regex check if redisDb is a valid number
	if (/^\d+$/.test(redisDb.toString()) === false) {
		console.log(chalk.red('Invalid Redis DB number!'));
		console.log(chalk.yellow('Application will continue without Redis functionality'));
		return null;
	}

	let redisUrl = 'redis://';

	if (redisUser && redisPassword) {
		redisUrl += `${redisUser}:${redisPassword}@`;
	}

	redisUrl += `${redisHost}:${redisPort}`;

	try {
		console.log(chalk.gray('Connecting to Redis...'));
		const tempRedisClient = redis.createClient({
			url: redisUrl,
			database: parseInt(redisDb.toString())
		});

		tempRedisClient.on('error', (error) => {
			console.log(chalk.red('Redis connection error:'), error);
			redisConnected = false;
		});

		tempRedisClient.on('disconnect', () => {
			console.log(chalk.yellow('Redis disconnected'));
			redisConnected = false;
		});

		await tempRedisClient.connect();
		await tempRedisClient.ping();

		console.log(chalk.green('Connected to Redis!'));
		redisConnected = true;
		return (redisClient = tempRedisClient);
	} catch {
		redisConnected = false;
		return null;
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	const { request, cookies, url } = event;

	const isProduction = process.env.NODE_ENV === 'production';
	const isSecureContext = url.protocol === 'https:' || isProduction;
	const csrfCookieMaxAge = 60 * 60 * 24 * 7; // 7 days

	const redisClient = await getRedisClient();

	if (!redisClient) {
		return error(500, 'Redis connection failed');
	}

	let csrfId = cookies.get(CSRF_ID_COOKIE_NAME);
	if (!csrfId) {
		csrfId = makeid(64);
		cookies.set(CSRF_ID_COOKIE_NAME, csrfId, {
			path: '/',
			httpOnly: true,
			sameSite: isSecureContext ? 'strict' : 'lax',
			secure: isSecureContext,
			maxAge: csrfCookieMaxAge,
			priority: 'high'
		});
	}

	if (STATE_CHANGING_METHODS.includes(request.method)) {
		const contentType = request.headers.get('content-type') || '';
		let tokenFromRequest: string | null = request.headers.get('x-csrf-token');

		if (
			!tokenFromRequest &&
			(contentType.includes('application/x-www-form-urlencoded') ||
				contentType.includes('multipart/form-data'))
		) {
			try {
				const clonedRequest = request.clone();
				const formData = await clonedRequest.formData();
				tokenFromRequest = formData.get('csrf_token')?.toString() || null;
			} catch (err) {
				return json({ error: 'Invalid form data' }, { status: 400 });
			}
		}

		if (!tokenFromRequest) {
			return json(
				{ error: 'CSRF token validation failed' },
				{
					status: 403,
					headers: { 'X-CSRF-Error': 'Missing CSRF token' }
				}
			);
		}

		const isValid = await validateCsrfToken(redisClient, tokenFromRequest, csrfId);

		if (!isValid) {
			return json(
				{ error: 'CSRF token validation failed' },
				{
					status: 403,
					headers: { 'X-CSRF-Error': 'Invalid or expired CSRF token' }
				}
			);
		}
	}

	let csrfToken = cookies.get(CSRF_COOKIE_NAME);

	if (!csrfToken) {
		csrfToken = generateCsrfToken();
		await storeCsrfToken(redisClient, csrfToken, csrfId, csrfCookieMaxAge);

		cookies.set(CSRF_COOKIE_NAME, csrfToken, {
			path: '/',
			httpOnly: false, // allow client-side to read token
			sameSite: isSecureContext ? 'strict' : 'lax',
			secure: isSecureContext,
			maxAge: csrfCookieMaxAge,
			priority: 'high'
		});
	}

	event.locals.csrfToken = csrfToken;

	return resolve(event);
};

export function handleError({ error }): void {
	console.log(chalk.red((error as Error).stack ?? error));
}
