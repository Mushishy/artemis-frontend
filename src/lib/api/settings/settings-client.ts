import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

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
	},
	ludusProxmox: {
		url: env.PUBLIC_LUDUS_PROXMOX_SERVER
	},
	gitlab: {
		url: env.PUBLIC_GITLAB_URL
	}
} as const;