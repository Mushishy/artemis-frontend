import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Server-side only settings
export const serverApiKey = privateEnv.LUDUS_API_KEY;

export const SERVER_API_ENDPOINTS = {
	dulus: {
		server: env.PUBLIC_DULUS_SERVER
	},
	ludus: {
		server: env.PUBLIC_LUDUS_SERVER
	},
	ludusAdmin: {
		server: env.PUBLIC_LUDUS_ADMIN_SERVER
	}
} as const;
