import { env } from '$env/dynamic/public';

export const dulusApiKey = env.PUBLIC_VITE_DULUS_API_KEY;
export const ludusApiKey = env.PUBLIC_VITE_LUDUS_API_KEY;

export const API_ENDPOINTS = {
	dulus: {
		server: env.PUBLIC_DULUS_SERVER,
		client: '/api/proxy/dulus'
	},
	ludus: {
		server: env.PUBLIC_LUDUS_SERVER,
		client: '/api/proxy/ludus'
	},
	ludusAdmin: {
		server: env.PUBLIC_LUDUS_ADMIN_SERVER,
		client: '/api/proxy/ludus-admin'
	}
} as const;