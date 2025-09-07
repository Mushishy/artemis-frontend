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
	}
} as const;

// Dynamic API key getter
export function getApiKey(): string | null {
	if (!browser) {
		return null;
	}
	
	try {
		// Get API key from cookie
		const savedApiKey = document.cookie
			.split('; ')
			.find(row => row.startsWith('api_key='))
			?.split('=')[1];
		
		return savedApiKey ? decodeURIComponent(savedApiKey) : null;
	} catch (error) {
		console.error('Error getting API key:', error);
		return null;
	}
}