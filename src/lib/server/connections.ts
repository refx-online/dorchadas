import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';
import knexPackage from 'knex';
import redis from 'redis';

const { knex } = knexPackage;

let mysqlDatabase: knexPackage.Knex | undefined;
let redisClient:
	| redis.RedisClientType<
			redis.RedisDefaultModules & redis.RedisModules,
			redis.RedisFunctions,
			redis.RedisScripts
	  >
	| undefined;

let isMysqlConnected = false;
let isRedisConnected = false;

export const getMySQLDatabase = async (): Promise<knexPackage.Knex | null> => {
	if (mysqlDatabase && isMysqlConnected) return mysqlDatabase;

	try {
		logger.debug('Connecting to MySQL database...');
		const tempMysqlDatabase = knex({
			client: 'mysql2',
			connection: {
				host: env.MYSQL_HOST,
				port: env.MYSQL_PORT ? parseInt(env.MYSQL_PORT) : 3306,
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
