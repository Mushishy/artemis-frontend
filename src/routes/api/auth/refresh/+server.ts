import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyToken, createToken, TOKEN_EXPIRY, createSecureCookieOptions } from '$lib/utils/jwt-auth';
import { getAuthenticatedApiKey } from '$lib/utils/auth-guard';

export const POST: RequestHandler = async ({ cookies }) => {
    try {
        // Get refresh token from cookie
        const refreshToken = cookies.get('refresh_token');
        
        if (!refreshToken) {
            return json({ error: 'No refresh token provided' }, { status: 401 });
        }

        // Verify refresh token
        const payload = await verifyToken(refreshToken);
        
        if (!payload || payload.type !== 'refresh') {
            return json({ error: 'Invalid refresh token' }, { status: 401 });
        }

        // Get the current API key from the existing access token (if still valid)
        // This way we can refresh without requiring re-login
        const currentApiKey = await getAuthenticatedApiKey({ cookies } as any);
        
        if (!currentApiKey) {
            // If no valid access token exists, user needs to re-login
            return json({ error: 'Please login again to refresh API access' }, { status: 401 });
        }

        // Create new access token with the same API key
        const newAccessToken = await createToken(
            { username: payload.username, apiKey: currentApiKey, type: 'access' }, 
            TOKEN_EXPIRY.ACCESS
        );
        
        // Set new access token cookie
        const accessCookieOptions = createSecureCookieOptions(60 * 60); // 1 hour
        cookies.set('access_token', newAccessToken, accessCookieOptions);
        
        return json({ 
            success: true,
            user: { username: payload.username }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return json({ error: 'Token refresh failed' }, { status: 500 });
    }
};