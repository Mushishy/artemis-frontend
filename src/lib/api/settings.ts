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
		// Get API key from cookie - same logic as auth store
		const allCookies = document.cookie;
		const savedApiKey = allCookies
			.split('; ')
			.find(row => row.startsWith('api_key='))
			?.split('=')[1];
		
		const result = savedApiKey ? decodeURIComponent(savedApiKey) : null;
		
		/*
		console.log('getApiKey() called:', {
			hasCookies: !!allCookies,
			foundApiKeyCookie: !!savedApiKey,
			result: result ? '[FOUND]' : null
		});
		*/

		return result;
	} catch (error) {
		console.error('Error getting API key:', error);
		return null;
	}
}