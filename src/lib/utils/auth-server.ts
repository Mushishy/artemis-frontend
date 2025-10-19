import type { RequestEvent } from '@sveltejs/kit';
import { activeSessions } from '../server/sessions';

/**
 * Get the API key for the current user's session
 * This should be used in server-side code to get the authenticated user's API key
 */
export function getSessionApiKey(event: RequestEvent): string | null {
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

/**
 * Check if the current request is authenticated
 */
export function isAuthenticated(event: RequestEvent): boolean {
    return getSessionApiKey(event) !== null;
}