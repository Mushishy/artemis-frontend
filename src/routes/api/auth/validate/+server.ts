import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyToken } from '$lib/utils/jwt-auth';

export const GET: RequestHandler = async ({ cookies }) => {
    try {
        // Get token from cookies only (we use HTTP-only cookies)
        const token = cookies.get('access_token');
        
        if (!token) {
            return json({ authenticated: false });
        }
        
        // Verify the JWT token
        const payload = await verifyToken(token);
        
        if (!payload || payload.type !== 'access') {
            return json({ authenticated: false });
        }
        
        return json({ 
            authenticated: true,
            user: {
                username: payload.username
            }
        });
        
    } catch (error) {
        console.error('Token validation error:', error);
        return json({ authenticated: false });
    }
};