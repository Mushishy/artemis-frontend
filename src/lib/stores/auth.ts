import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const apiKeyStore = writable<string | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Load API key from cookie on app start
if (browser) {
	const savedApiKey = document.cookie
		.split('; ')
		.find(row => row.startsWith('api_key='))
		?.split('=')[1];
	
	if (savedApiKey) {
		const decodedKey = decodeURIComponent(savedApiKey);
		apiKeyStore.set(decodedKey);
		isAuthenticated.set(true);
	}
}

export function setApiKey(key: string) {
	apiKeyStore.set(key);
	isAuthenticated.set(true);
	
	// Save to secure cookie (7 days)
	if (browser) {
		document.cookie = `api_key=${encodeURIComponent(key)}; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict; path=/`;
	}
}

export function logout() {
	apiKeyStore.set(null);
	isAuthenticated.set(false);
	
	if (browser) {
		document.cookie = 'api_key=; max-age=0; path=/';
	}
}

export async function validateApiKey(key: string): Promise<boolean> {
	try {
		// Test the API key by making a simple request to dulus endpoint via proxy
		// The proxy handles SSL certificate issues for us
		const response = await fetch('/api/proxy/dulus/ctfd/scenario', {
			method: 'GET',
			headers: {
				'X-API-Key': key,
				'Accept': 'application/json'
			}
		});

		return response.ok;
	} catch (error) {
		console.error('API key validation failed:', error);
		return false;
	}
}
