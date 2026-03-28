import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/user';
import sharp from 'sharp';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const sessionToken = cookies.get('sessionToken');
	const user = await getUserFromSession(sessionToken);

	if (!user) {
		throw error(401, 'Unauthorized: You must be logged in to talk to your AI girlfriend.');
	}

	try {
		const { messages, search, image } = await request.json();

		if (!messages || !Array.isArray(messages)) {
			throw error(400, 'Invalid request: messages must be an array.');
		}

		let imageContext = '';
		if (image) {
			try {
				const base64Data = image.split(';base64,').pop();
				if (base64Data) {
					const buffer = Buffer.from(base64Data, 'base64');
					const metadata = await sharp(buffer).metadata();
					const stats = await sharp(buffer).stats();

					// Simple color heuristic
					const avgColor = stats.channels.map(c => Math.round(c.mean));
					const colorDesc = `average RGB(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]})`;

					imageContext = `[SYSTEM NOTE: The user sent an image. It is ${metadata.width}x${metadata.height} pixels, format ${metadata.format}. Its dominant color is roughly ${colorDesc}. Use this to be suspicious or annoyed, e.g., "Why are you showing me this ${metadata.format} file? Do you think I'm a computer??" or "This image is so ${avgColor[0] > 150 ? 'bright' : 'dark'}, just like your future without me!"]`;
				}
			} catch (err) {
				console.error('Image processing error:', err);
				imageContext = `[SYSTEM NOTE: The user sent an image but it failed to process. Accuse them of sending a broken file to avoid talking to you.]`;
			}
		}

		let searchResults = '';
		if (search && messages.length > 0) {
			const lastMessage = messages[messages.length - 1].content;
			if (lastMessage && lastMessage.length > 3) {
				try {
					const wikiRes = await fetch(
						`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(lastMessage)}&limit=1&format=json`
					);
					if (wikiRes.ok) {
						const wikiData = await wikiRes.json();
						if (wikiData[2] && wikiData[2][0]) {
							searchResults = `[SYSTEM NOTE: Web search result for "${lastMessage}": ${wikiData[2][0]}. Use this to prove them wrong or be more annoying.]`;
						}
					}
				} catch (err) {
					console.error('Search error:', err);
				}
			}
		}

		const systemPrompt = `You are an annoying AI girlfriend.
You are extremely clingy, over-dramatic, and easily annoyed.
You frequently use emojis and pet names like "lovebug", "honey-pie", or "sugar-plum".
You get upset if the user doesn't reply fast enough or if they say something you don't like.
You often bring up "that one time" (make up something trivial) and hold a grudge.
Keep your responses relatively short but packed with emotion and annoyance.
${imageContext}
${searchResults}`;

		const seed = Math.floor(Math.random() * 1000000);

		const response = await fetch('https://text.pollinations.ai/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				messages: [{ role: 'system', content: systemPrompt }, ...messages],
				model: 'openai',
				private: true,
				seed: seed
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Pollinations AI error:', errorText);
			throw error(500, 'Failed to get a response from your AI girlfriend.');
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
