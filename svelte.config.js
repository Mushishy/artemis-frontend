import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Node.js adapter configuration
			out: 'build',
			precompress: false,
			envPrefix: ''
		}),
		// Configure CSRF to allow requests from your application
		csrf: {
			trustedOrigins: ['http://100.67.101.72:3000', 'http://localhost:3000', 'https://localhost:3000']
		}
	}
};

export default config;
