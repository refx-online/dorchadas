import type { Handle } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { generateCsrfToken, validateCsrfToken, storeCsrfToken } from '$lib/csrf';
import { getRedisClient } from '$lib/server/connections';
import { makeid } from '$lib/string';
import { logger } from '$lib/logger';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_ID_COOKIE_NAME = 'csrf_id';
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

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
	const hasValidStoredToken = csrfToken
		? await validateCsrfToken(redisClient, csrfToken, csrfId)
		: false;

	if (!csrfToken || !hasValidStoredToken) {
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
