import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		fs: {
			allow: ['..']
		},
		proxy: {
			'^/proxy/ludus-admin/.*': {
				target: 'https://localhost:8081',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/proxy\/ludus-admin/, '')
			},
			'^/proxy/ludus/.*': {
				target: 'https://localhost:8080',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/proxy\/ludus/, '')
			},
			'^/proxy/dulus/.*': {
				target: 'http://127.0.0.1:5000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/proxy\/dulus/, '')
			}
		}
	}
});
