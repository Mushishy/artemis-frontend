/**
 * Client-side JWT authentication utilities
 * No more custom crypto - just standard JWT handling!
 */

/**
 * Get access token from cookie (for API calls)
 */
export function getAccessToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const match = document.cookie.match(/access_token=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : null;
    return token;
}

/**
 * Parse JWT payload (client-side only for UI purposes)
 * Note: Never trust client-side JWT parsing for security decisions
 */
export function parseJwtPayload(token: string): any | null {
    try {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload);
        return JSON.parse(payload);
    } catch (error) {
        console.error('Failed to parse JWT payload:', error);
        return null;
    }
}

/**
 * Check if JWT token is expired (client-side only)
 */
export function isTokenExpired(token: string): boolean {
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) return true;
    
    return Date.now() >= payload.exp * 1000;
}

/**
 * Get current user info from access token (client-side only)
 */
export function getCurrentUserClient(): { username: string } | null {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) return null;
    
    const payload = parseJwtPayload(token);
    if (!payload) return null;
    
    return {
        username: payload.username
    };
}

/**
 * Set Authorization header for API requests
 */
export function getAuthHeaders(): Record<string, string> {
    const token = getAccessToken();
    
    if (!token) {
        return {};
    }
    
    return {
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Check if token is valid (no refresh since API key not in refresh tokens)
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
    const token = getAccessToken();
    
    // Just check if token exists and is not expired
    if (!token || isTokenExpired(token)) {
        return false; // Need to re-login
    }
    
    return true; // Token is still valid
}