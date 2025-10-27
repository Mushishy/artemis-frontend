import { env } from '$env/dynamic/public';
import { verifyToken } from '$lib/utils/jwt-auth';

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
