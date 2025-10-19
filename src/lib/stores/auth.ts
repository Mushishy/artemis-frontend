import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getApiKeyFromCookie } from '$lib/utils/crypto-client';

export const apiKeyStore = writable<string | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Check authentication status on app start
if (browser) {
	checkAuthStatus();
}

async function checkAuthStatus() {
	try {
		// Check if we have a valid session
		const response = await fetch('/api/auth/validate');
		const { authenticated } = await response.json();
		
		if (authenticated) {
			// Get the decrypted API key from cookie
			const apiKey = getApiKeyFromCookie();
			if (apiKey) {
				apiKeyStore.set(apiKey);
				isAuthenticated.set(true);
			} else {
				// Session valid but no API key cookie - logout
				await logout();
			}
		} else {
			// Not authenticated - clear any stale data
			apiKeyStore.set(null);
			isAuthenticated.set(false);
		}
	} catch (error) {
		console.error('Auth status check failed:', error);
		isAuthenticated.set(false);
	}
}

export async function login(key: string): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ apiKey: key })
		});

		const result = await response.json();

		if (response.ok && result.success) {
			// Get the decrypted API key from the cookie that was just set
			const apiKey = getApiKeyFromCookie();
			if (apiKey) {
				apiKeyStore.set(apiKey);
				isAuthenticated.set(true);
				return { success: true };
			} else {
				return { success: false, error: 'Failed to retrieve encrypted API key' };
			}
		} else {
			return { success: false, error: result.error || 'Login failed' };
		}
	} catch (error) {
		console.error('Login error:', error);
		return { success: false, error: 'Network error occurred' };
	}
}

// Legacy function for backward compatibility
export function setApiKey(key: string) {
	// This is now handled by the login function
	console.warn('setApiKey is deprecated, use login() instead');
}

export async function logout(): Promise<void> {
	try {
		// Call server endpoint to clear HTTP-only cookies
		await fetch('/api/auth/logout', {
			method: 'POST'
		});
	} catch (error) {
		console.error('Logout error:', error);
	} finally {
		// Clear client state regardless of server response
		apiKeyStore.set(null);
		isAuthenticated.set(false);
	}
}

export async function validateApiKey(key: string): Promise<boolean> {
	try {
		// Use the new login endpoint for validation
		const result = await login(key);
		return result.success;
	} catch (error) {
		console.error('API key validation failed:', error);
		return false;
	}
}
