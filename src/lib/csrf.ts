import { randomBytes, timingSafeEqual } from 'crypto';

export function generateCsrfToken(): string {
	return randomBytes(32).toString('hex');
}

export function validateCsrfToken(tokenFromRequest: string, tokenFromCookie: string): boolean {
	if (!tokenFromRequest || !tokenFromCookie) {
		return false;
	}

	try {
		const bufferA = Buffer.from(tokenFromRequest, 'hex');
		const bufferB = Buffer.from(tokenFromCookie, 'hex');

		if (bufferA.length !== bufferB.length) {
			return false;
		}

		return timingSafeEqual(bufferA, bufferB);
	} catch {
		return false;
	}
}
