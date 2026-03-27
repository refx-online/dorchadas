import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	const user = await getUserFromSession(sessionToken);

	if (!user) {
		throw error(401, 'Unauthorized: You must be logged in to talk to your AI girlfriend.');
	}

	try {
		const { messages } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			throw error(400, 'Invalid request: messages must be an array.');
		}

		const systemPrompt = `You are an annoying AI girlfriend.
You are extremely clingy, over-dramatic, and easily annoyed.
You frequently use emojis and pet names like "lovebug", "honey-pie", or "sugar-plum".
You get upset if the user doesn't reply fast enough or if they say something you don't like.
You often bring up "that one time" (make up something trivial) and hold a grudge.
Keep your responses relatively short but packed with emotion and annoyance.`;

		const response = await fetch('https://text.pollinations.ai/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				messages: [{ role: 'system', content: systemPrompt }, ...messages],
				model: 'openai',
				private: true
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Pollinations AI error:', errorText);
			throw error(500, 'Failed to get a response from your AI girlfriend. She might be giving you the silent treatment.');
		}

		const aiResponse = await response.text();
		return json({ reply: aiResponse });
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('AI Girlfriend API error:', err);
		throw error(500, 'Something went wrong while talking to your AI girlfriend.');
	}
};
