import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { activeSessions } from '../server/sessions';

/**
 * Server-side authentication guard
 * Redirects to home page if user is not authenticated
 */
export function requireAuth(event: RequestEvent): string {
    const sessionId = event.cookies.get('session_id');
    
    if (!sessionId) {
        throw redirect(302, '/');
    }

    const session = activeSessions.get(sessionId);
    
    if (!session || Date.now() > session.expires) {
        // Clean up expired session
        if (session) {
            activeSessions.delete(sessionId);
        }
        
        // Clear cookies
        event.cookies.delete('session_id', { path: '/' });
        event.cookies.delete('api_key', { path: '/' });
        
        throw redirect(302, '/');
    }

    return session.apiKey;
}

/**
 * Check if user is authenticated without throwing redirect
 * Returns API key if authenticated, null otherwise
 */
export function getAuthenticatedApiKey(event: RequestEvent): string | null {
    const sessionId = event.cookies.get('session_id');
    
    if (!sessionId) {
        return null;
    }

    const session = activeSessions.get(sessionId);
    
    if (!session || Date.now() > session.expires) {
        // Clean up expired session
        if (session) {
            activeSessions.delete(sessionId);
        }
        
        // Clear cookies
        event.cookies.delete('session_id', { path: '/' });
        event.cookies.delete('api_key', { path: '/' });
        
        return null;
    }

    return session.apiKey;
}