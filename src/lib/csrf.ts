import { randomBytes } from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_REDIS_KEY_PREFIX = 'csrf:token:';

type RedisClient = {
	setEx: (key: string, seconds: number, value: string) => Promise<string>;
	exists: (key: string) => Promise<number>;
	del: (key: string) => Promise<number>;
	get: (key: string) => Promise<string | null>;
};

export function generateCsrfToken(): string {
	return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Stores a CSRF token in Redis with binding to an httpOnly CSRF ID cookie.
 * The token is bound to that cookie to prevent token fixation attacks.
 *
 * @param redisClient - Redis client instance
 * @param token - The CSRF token to store
 * @param sessionToken - The CSRF ID or session-like value to bind this token to
 * @param ttl - Time to live in seconds
 * @returns true if stored successfully, false otherwise
 */
export async function storeCsrfToken(
	redisClient: RedisClient,
	token: string,
	sessionToken: string | undefined,
	ttl: number
): Promise<boolean> {
	try {
		const key = `${CSRF_REDIS_KEY_PREFIX}${token}`;
		// Store session token as value to bind CSRF token to session
		// If no session, store a marker value
		const value = sessionToken || 'guest';

		await redisClient.setEx(key, ttl, value);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validates a CSRF token from Redis without consuming it.
 * This function checks if the token exists and validates CSRF ID binding.
 *
 * @param redisClient - Redis client instance
 * @param token - The token to validate
 * @param sessionValue - The session value to validate against (e.g. session token or CSRF ID)
 * @returns true if token exists and is valid, false otherwise
 */
export async function validateCsrfToken(
	redisClient: RedisClient,
	token: string,
	sessionValue: string
): Promise<boolean> {
	if (!token) {
		return false;
	}

	try {
		const key = `${CSRF_REDIS_KEY_PREFIX}${token}`;
		const storedSessionValue = await redisClient.get(key);

		if (storedSessionValue === null) {
			return false;
		}

		return storedSessionValue === sessionValue;
	} catch {
		return false;
	}
}

/**
 * Validates and consumes a one-time CSRF token from Redis.
 * This function checks if the token exists, validates session binding,
 * and then deletes the token to ensure it can only be used once.
 *
 * @param redisClient - Redis client instance
 * @param token - The token to validate
 * @param sessionToken - The current session token to validate against
 * @returns true if token exists, is valid, and successfully consumed, false otherwise
 */
export async function validateAndConsumeCsrfToken(
	redisClient: RedisClient,
	token: string,
	sessionToken: string | undefined
): Promise<boolean> {
	const expectedSessionValue = sessionToken || 'guest';
	const isValid = await validateCsrfToken(redisClient, token, expectedSessionValue);

	if (!isValid) {
		return false;
	}

	try {
		const key = `${CSRF_REDIS_KEY_PREFIX}${token}`;
		const deleted = await redisClient.del(key);

		// Return true only if we successfully deleted the token
		return deleted === 1;
	} catch {
		return false;
	}
}
