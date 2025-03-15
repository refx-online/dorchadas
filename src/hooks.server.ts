import { env } from '$env/dynamic/private';
import chalk from 'chalk';
import knex_pkg from 'knex';
import redis from 'redis';
import { csrf } from '$lib/csrf';
import { randomBytes } from 'crypto';

const { knex } = knex_pkg;

let mysqlDatabase: knex_pkg.Knex | undefined;
let redisClient:
	| redis.RedisClientType<
			redis.RedisDefaultModules & redis.RedisModules,
			redis.RedisFunctions,
			redis.RedisScripts
	  >
	| undefined;

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function retry<T>(
	operation: () => Promise<T>,
	name: string,
	maxRetries: number = MAX_RETRIES,
	delay: number = RETRY_DELAY
): Promise<T | null> {
	let lastError: any;
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			if (attempt === maxRetries) {
				console.log(chalk.red(`Failed to connect to ${name} after ${maxRetries} attempts`));
				console.log(chalk.red(`Last error: ${error.message}`));
				return null;;
			}
			console.log(chalk.yellow(`Attempt ${attempt}/${maxRetries} failed, retrying in ${delay/1000}s...`));
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}
	
	throw lastError;
}

export const getMySQLDatabase = async (): Promise<knex_pkg.Knex> => {
	if (mysqlDatabase) return mysqlDatabase;
	const connectMySQL = async () => {
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
		return tempMysqlDatabase;
	};

	return (mysqlDatabase = await retry(connectMySQL, 'MySQL'));
};

export const getRedisClient = async (): Promise<
	redis.RedisClientType<
		redis.RedisDefaultModules & redis.RedisModules,
		redis.RedisFunctions,
		redis.RedisScripts
	>
> => {
	if (redisClient) return redisClient;
	const redisUser = env.REDIS_USER ?? undefined;
	const redisPassword = env.REDIS_PASSWORD ?? undefined;
	const redisHost = env.REDIS_HOST ?? '127.0.0.1';
	const redisPort = env.REDIS_PORT ?? 6379;
	let redisDb = env.REDIS_DB ?? 0;

	//do regex check if redisDb is a valid number
	if (!/^\d+$/.test(redisDb.toString())) {
		console.log(chalk.red('Invalid Redis DB!'));
		redisDb = '0';
	}

	let redisUrl = 'redis://';

	if (redisUser && redisPassword) {
		redisUrl += `${redisUser}:${redisPassword}@`;
	}

	redisUrl += `${redisHost}:${redisPort}`;

	const connectRedis = async () => {
		console.log(chalk.gray('Connecting to Redis...'));
		const tempRedisClient = redis.createClient({
			url: redisUrl,
			database: parseInt(redisDb.toString())
		});

		tempRedisClient.on('error', (error) => {
			if (error.code === 'ECONNREFUSED') {
				throw new Error('Could not connect to Redis!');
			} else {
				throw new Error(`Unknown Redis error: ${error.message}`);
			}
		});

		await tempRedisClient.connect();
		await tempRedisClient.ping();
		console.log(chalk.green('Connected to Redis!'));
		return tempRedisClient;
	};

	return (redisClient = await retry(connectRedis, 'Redis'));
};

// i to be honest hate to put all of the endpoint but it is what it is
// HELP I DONT KNOW SVELTE
// these are the endpoints that allowed
export const handle = async ({ event, resolve }) => {
    const cookies = event.cookies;
    let csrfToken = cookies.get('csrf_token');

    if (!csrfToken) {
        csrfToken = randomBytes(32).toString('hex');
        cookies.set('csrf_token', csrfToken, {
            httpOnly: false,
            sameSite: 'strict',
            secure: true,
            path: '/'
        });
    }
	
    if (['POST', 'PUT', 'DELETE'].includes(event.request.method)) {
        const requestToken = event.request.headers.get('x-csrf-token');
        if (!requestToken || requestToken !== csrfToken) {
            return new Response('Forbidden (CSRF)', { status: 403 });
        }
    }

    return resolve(event);
};

export function handleError({ error }): void {
	console.log(chalk.red((error as Error).stack ?? error));
}
