import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyToken, clearAuthCookie } from '$lib/utils/jwt-auth';

export const GET: RequestHandler = async ({ cookies }) => {
    try {
        // Get token from cookies only (we use HTTP-only cookies)
        const token = cookies.get('auth_token');
        
        if (!token) {
            return json({ authenticated: false });
        }
        
        // Verify the JWT token
        const payload = await verifyToken(token);
        
        if (!payload) {
            // Clear invalid cookie
            clearAuthCookie(cookies);
            return json({ authenticated: false });
        }
        
        return json({ 
            authenticated: true,
            user: {
                username: payload.username
            }
        });
        
    } catch (error) {
        // Clear invalid cookie on any error
        console.error('Token validation error:', error);
        clearAuthCookie(cookies);
        return json({ authenticated: false });
    }
};