import { json, type RequestHandler } from '@sveltejs/kit';
import { activeSessions } from '$lib/server/sessions';

export const GET: RequestHandler = async ({ cookies }) => {
    const sessionId = cookies.get('session_id');
    
    if (!sessionId) {
        return json({ authenticated: false });
    }

    const session = activeSessions.get(sessionId);
    
    if (!session || Date.now() > session.expires) {
        // Clean up expired session
        if (session) {
            activeSessions.delete(sessionId);
        }
        
        // Clear cookies
        cookies.delete('session_id', { path: '/' });
        cookies.delete('api_key', { path: '/' });
        
        return json({ authenticated: false });
    }

    return json({ authenticated: true });
};