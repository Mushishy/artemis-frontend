import { env } from '$env/dynamic/public';
import { verifyToken } from '$lib/utils/jwt-auth';

/**
 * Extract API key from JWT token in request
 * This is the SECURE way to get API keys server-side
 */
export async function getApiKeyFromRequest(request: Request): Promise<string | null> {
    try {
        // Get token from cookie header
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader) return null;
        
        const match = cookieHeader.match(/access_token=([^;]+)/);
        if (!match) return null;
        
        const token = decodeURIComponent(match[1]);
        const payload = await verifyToken(token);
        
        if (!payload || payload.type !== 'access' || !payload.apiKey) {
            return null;
        }
        
        return payload.apiKey;
    } catch (error) {
        console.error('Failed to extract API key from JWT:', error);
        return null;
    }
}

export const SERVER_API_ENDPOINTS = {
	dulus: {
		server: env.PUBLIC_DULUS_SERVER
	},
    // Prefer private server URL for server-side calls (internal network). Fall back to public URL.
    ludus: {
        server: env.PUBLIC_LUDUS_SERVER
    },
	ludusAdmin: {
		server: env.PUBLIC_LUDUS_ADMIN_SERVER
	}
} as const;
