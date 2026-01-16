import type { Handle } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { generateCsrfToken, validateCsrfToken } from '$lib/csrf';
import { env } from '$env/dynamic/private';
import chalk from 'chalk';
import knex_pkg from 'knex';
import redis from 'redis';

const { knex } = knex_pkg;

const CSRF_COOKIE_NAME = 'csrf_token';
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
	} catch (error) {
		console.log(chalk.red('Could not connect to MySQL database:'), error);
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
			database: parseInt(redisDb)
		});

		tempRedisClient.on('error', (error) => {
			console.log(chalk.red('Redis connection error:'), error);
			redisConnected = false;
		});

		tempRedisClient.on('disconnect', () => {
			console.log(chalk.yellow('Redis disconnected'));
			redisConnected = false;
		});

		tempRedisClient.on('reconnecting', () => {
			// actually dont log since itll fill up the console
			// console.log(chalk.gray('Attempting to reconnect to Redis...'));
		});

		await tempRedisClient.connect();
		await tempRedisClient.ping();

		console.log(chalk.green('Connected to Redis!'));
		redisConnected = true;
		return (redisClient = tempRedisClient);
	} catch (error) {
		console.log(chalk.red('Could not connect to Redis:'), error);
		console.log(chalk.yellow('Application will continue without Redis functionality'));
		redisConnected = false;
		return null;
	}
};

export const isMySQLConnected = (): boolean => mysqlConnected;
export const isRedisConnected = (): boolean => redisConnected;

export const safeMySQLQuery = async <T>(
	queryFn: (db: knex_pkg.Knex) => Promise<T>,
	fallback?: T
): Promise<T | null> => {
	try {
		const db = await getMySQLDatabase();
		if (!db) {
			console.log(chalk.yellow('MySQL not available, skipping query'));
			return fallback ?? null;
		}
		return await queryFn(db);
	} catch (error) {
		console.log(chalk.red('MySQL query failed:'), error);
		mysqlConnected = false;
		return fallback ?? null;
	}
};

export const safeRedisOperation = async <T>(
	operationFn: (client: redis.RedisClientType) => Promise<T>,
	fallback?: T
): Promise<T | null> => {
	try {
		const client = (await getRedisClient()) as any;
		if (!client) {
			console.log(chalk.yellow('Redis not available, skipping operation'));
			return fallback ?? null;
		}
		return await operationFn(client);
	} catch (error) {
		console.log(chalk.red('Redis operation failed:'), error);
		redisConnected = false;
		return fallback ?? null;
	}
};

export const attemptMySQLReconnection = async (): Promise<boolean> => {
	if (mysqlConnected) return true;

	console.log(chalk.gray('Attempting MySQL reconnection...'));
	const db = await getMySQLDatabase();
	return db !== null;
};

export const attemptRedisReconnection = async (): Promise<boolean> => {
	if (redisConnected) return true;

	console.log(chalk.gray('Attempting Redis reconnection...'));
	const client = await getRedisClient();
	return client !== null;
};

export const initializeConnections = async (): Promise<void> => {
	console.log(chalk.blue('Initializing database connections...'));

	const [mysqlResult, redisResult] = await Promise.allSettled([
		getMySQLDatabase(),
		getRedisClient()
	]);

	if (mysqlResult.status === 'fulfilled' && mysqlResult.value) {
		console.log(chalk.green('✓ MySQL connection initialized'));
	} else {
		console.log(chalk.yellow('⚠ MySQL connection failed'));
	}

	if (redisResult.status === 'fulfilled' && redisResult.value) {
		console.log(chalk.green('✓ Redis connection initialized'));
	} else {
		console.log(chalk.yellow('⚠ Redis connection failed'));
	}

	console.log(chalk.blue('Application startup complete'));
};

export const handle: Handle = async ({ event, resolve }) => {
	const { request, cookies } = event;
	let csrfToken = cookies.get(CSRF_COOKIE_NAME);

	if (!csrfToken) {
		csrfToken = generateCsrfToken();
		cookies.set(CSRF_COOKIE_NAME, csrfToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 // 24 hours
		});
	}

	event.locals.csrfToken = csrfToken;

	if (STATE_CHANGING_METHODS.includes(request.method)) {
		const contentType = request.headers.get('content-type') || '';

		if (
			contentType.includes('application/x-www-form-urlencoded') ||
			contentType.includes('multipart/form-data')
		) {
			try {
				const clonedRequest = request.clone();
				const formData = await clonedRequest.formData();
				const tokenFromForm = formData.get('csrf_token')?.toString();

				if (!validateCsrfToken(tokenFromForm || '', csrfToken)) {
					throw error(403, 'Invalid token');
				}
			} catch (err) {
				throw error(400, 'Invalid form data');
			}
		} else if (contentType.includes('application/json')) {
			const tokenFromHeader = request.headers.get('x-csrf-token');

			if (!validateCsrfToken(tokenFromHeader || '', csrfToken)) {
				return json({ error: 'Invalid token' }, { status: 403 });
			}
		}
	}

	return resolve(event);
};

export function handleError({ error }): void {
	console.log(chalk.red((error as Error).stack ?? error));
}
