import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';
import { getAuthHeaders } from '$lib/utils/jwt-client';

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

// Get authentication headers for API requests (JWT-based)
export function getApiAuthHeaders(): Record<string, string> {
	if (!browser) {
		return {};
	}
	
	try {
		return getAuthHeaders();
	} catch (error) {
		console.error('Error getting auth headers:', error);
		return {};
	}
}