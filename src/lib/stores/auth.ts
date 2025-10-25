import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const userStore = writable<{ username: string } | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Check authentication status on app start
if (browser) {
	checkAuthStatus();
}

async function checkAuthStatus() {
	try {
		// Since we use HTTP-only cookies, we can't read them on client-side
		// So we just check directly with the server
		const response = await fetch('/api/auth/validate');
		const result = await response.json();
		
		if (result.authenticated) {
			userStore.set(result.user);
			isAuthenticated.set(true);
		} else {
			// Not authenticated - clear any stale data
			userStore.set(null);
			isAuthenticated.set(false);
		}
	} catch (error) {
		isAuthenticated.set(false);
	}
}

export async function login(apiKey: string): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ apiKey })
		});

		const result = await response.json();

		if (response.ok && result.success) {
			// Update stores with user info from JWT
			userStore.set(result.user);
			isAuthenticated.set(true);
			
			// Reload the current page instantly after successful authentication
			if (browser) {
				window.location.reload();
			}
			
			return { success: true };
		} else {
			return { success: false, error: result.error || 'Login failed' };
		}
	} catch (error) {
		console.error('Login error:', error);
		return { success: false, error: 'Network error occurred' };
	}
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
		userStore.set(null);
		isAuthenticated.set(false);
	}
}