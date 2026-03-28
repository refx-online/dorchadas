import type { Handle } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { generateCsrfToken, validateCsrfToken, storeCsrfToken } from '$lib/csrf';
import { env } from '$env/dynamic/private';
import { makeid } from '$lib/string-util';
import { logger } from '$lib/logger';
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

let isMysqlConnected = false;
let isRedisConnected = false;

export const getMySQLDatabase = async (): Promise<knex_pkg.Knex | null> => {
	if (mysqlDatabase && isMysqlConnected) return mysqlDatabase;

	try {
		logger.debug('Connecting to MySQL database...');
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
		logger.success('Connected to MySQL database!');
		isMysqlConnected = true;

		return (mysqlDatabase = tempMysqlDatabase);
	} catch (e) {
		logger.error('Failed to connect to MySQL', e);
		isMysqlConnected = false;
		return null;
	}
};

export const getRedisClient = async (): Promise<redis.RedisClientType<
	redis.RedisDefaultModules & redis.RedisModules,
	redis.RedisFunctions,
	redis.RedisScripts
> | null> => {
	if (redisClient && isRedisConnected) return redisClient;

	const redisUser = env.REDIS_USER ?? undefined;
	const redisPassword = env.REDIS_PASSWORD ?? undefined;
	const redisHost = env.REDIS_HOST ?? '127.0.0.1';
	const redisPort = env.REDIS_PORT ?? 6379;
	const redisDb = env.REDIS_DB ?? 0;

	if (/^\d+$/.test(redisDb.toString()) === false) {
		logger.error('Invalid Redis DB number!');
		logger.warn('Application will continue without Redis functionality');
		return null;
	}

	let redisUrl = 'redis://';

	if (redisUser && redisPassword) {
		redisUrl += `${redisUser}:${redisPassword}@`;
	}

	redisUrl += `${redisHost}:${redisPort}`;

	try {
		logger.debug('Connecting to Redis...');
		const tempRedisClient = redis.createClient({
			url: redisUrl,
			database: parseInt(redisDb.toString())
		});

		tempRedisClient.on('error', (error) => {
			logger.error('Redis connection error', error);
			isRedisConnected = false;
		});

		tempRedisClient.on('disconnect', () => {
			logger.warn('Redis disconnected');
			isRedisConnected = false;
		});

		await tempRedisClient.connect();
		await tempRedisClient.ping();

		logger.success('Connected to Redis!');
		isRedisConnected = true;
		return (redisClient = tempRedisClient);
	} catch (e) {
		logger.error('Failed to connect to Redis', e);
		isRedisConnected = false;
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
	logger.error('Unhandled application error', error);
}
