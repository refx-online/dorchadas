import { error, isHttpError, isRedirect } from '@sveltejs/kit';
import { logger } from '$lib/logger';

type RequestHandlerResult = Response | Promise<Response>;
type RequestHandler = (event: any) => RequestHandlerResult;

export const withApiErrorHandling =
	(message: string, handler: RequestHandler): RequestHandler =>
	async (event) => {
		try {
			return await handler(event);
		} catch (err) {
			if (isHttpError(err) || isRedirect(err)) {
				throw err;
			}

			logger.error(message, err);
			throw error(500, message);
		}
	};
