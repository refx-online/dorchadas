import { login } from '$lib/user';
import { error, json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	if (request.headers.get('content-type') !== 'application/json') {
		return error(400, 'Invalid content type');
	}

	const bodyData: { username: string; password: string; captchaToken: string } = JSON.parse(
		Buffer.from(await request.arrayBuffer()).toString('utf-8')
	);

	const user = await login({
		username: bodyData.username,
		password: bodyData.password
	});

	if (!user) return error(400, 'Invalid login credentials');

	return json({
		message: 'Login successful',
		user: {
			id: user.id,
			username: user.name,
			donor: user.donor_end > Math.floor(Date.now() / 1000)
		}
	});
};
