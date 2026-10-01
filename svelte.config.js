import adapter from 'svelte-adapter-bun';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess()],

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapters for more information about adapters.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		paths: {
			// NOTE: default relative asset urls break on nested routes
			// (/nerv/flags resolves ./_app to /nerv/_app which 404s),
			// leaving deep pages unstyled with dead js. we serve from
			// domain root, so absolute urls are correct.
			relative: false
		},
		csrf: {
			// we're using our own CSRF protection, so we don't need to check the origin
			checkOrigin: false
		}
	}
};
export default config;
