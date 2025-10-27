import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { verifyToken, clearAuthCookie, decryptApiKey } from './jwt-auth';



/**
 * Server-side authentication guard using single JWT token
 * Redirects to home page if user is not authenticated
 * Returns the decrypted API key for authenticated users
 */
export async function requireAuth(event: RequestEvent): Promise<string> {
    const authToken = event.cookies.get('auth_token');
    
    if (!authToken) {
        throw redirect(302, '/');
    }

    try {
        const payload = await verifyToken(authToken);        
        if (!payload || !payload.apiKey) {
            // Clear invalid cookie and redirect
            clearAuthCookie(event.cookies);
            throw redirect(302, '/');
        }
        
        // Decrypt and return the API key
        return decryptApiKey(payload.apiKey);
    } catch (error) {
        console.error('🔒 Authentication error:', error);
        // Clear invalid cookie and redirect
        clearAuthCookie(event.cookies);
        throw redirect(302, '/');
    }
}

/**
 * Check if user is authenticated without throwing redirect
 * Returns API key if authenticated, null otherwise
 */
export async function getAuthenticatedApiKey(event: RequestEvent): Promise<string | null> {
    const authToken = event.cookies.get('auth_token');
    
    if (!authToken) {
        return null;
    }

    try {
        const payload = await verifyToken(authToken);
        
        if (!payload || !payload.apiKey) {
            // Clear invalid cookie
            clearAuthCookie(event.cookies);
            return null;
        }
        
        // Decrypt and return the API key
        return decryptApiKey(payload.apiKey);
    } catch (error) {
        console.error('Authentication error:', error);
        // Clear invalid cookie
        clearAuthCookie(event.cookies);
        return null;
    }
}

/**
 * Get current authenticated user from JWT token
 * Returns user info if authenticated, null otherwise
 */
export async function getCurrentUser(event: RequestEvent) {
    const authToken = event.cookies.get('auth_token');
    
    if (!authToken) {
        return null;
    }
    
    try {
        const payload = await verifyToken(authToken);
        
        if (!payload) {
            // Clear invalid cookie
            clearAuthCookie(event.cookies);
            return null;
        }
        
        return {
            username: payload.username
        };
    } catch (error) {
        console.error('JWT validation error:', error);
        // Clear invalid cookie
        clearAuthCookie(event.cookies);
        return null;
    }
}