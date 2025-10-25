import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env as privateEnv } from '$env/dynamic/private';

// JWT configuration - MUST be set in environment variables
const JWT_SECRET_KEY = privateEnv.PRIVATE_JWT_SECRET;
if (!JWT_SECRET_KEY) {
    throw new Error('PRIVATE_JWT_SECRET environment variable is required for security');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);
const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'artemis-frontend';
const JWT_AUDIENCE = 'artemis-users';

// Token expiration times
export const TOKEN_EXPIRY = {
    ACCESS: '1h',    // 1 hour for access tokens
    REFRESH: '7d'    // 7 days for refresh tokens
} as const;

export interface AuthTokenPayload extends JWTPayload {
    username: string;
    type: 'access' | 'refresh';
    apiKey?: string; // LUDUS_API_KEY embedded ONLY in access tokens for server-side API calls
}

/**
 * Create a signed JWT token
 */
export async function createToken(
    payload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
    expiresIn: string = TOKEN_EXPIRY.ACCESS
): Promise<string> {
    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime(expiresIn)
        .sign(JWT_SECRET);
    
    return jwt;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });
        
        return payload as AuthTokenPayload;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

/**
 * Create access and refresh token pair with API key ONLY in access token
 */
export async function createTokenPair(username: string, apiKey: string) {
    const [accessToken, refreshToken] = await Promise.all([
        createToken({ username, apiKey, type: 'access' }, TOKEN_EXPIRY.ACCESS),
        createToken({ username, type: 'refresh' }, TOKEN_EXPIRY.REFRESH) // No API key in refresh token
    ]);
    
    return { accessToken, refreshToken };
}

/**
 * Extract token from Authorization header or cookies
 */
export function extractToken(request: Request): string | null {
    // Try Authorization header first (Bearer token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    
    // Fallback to cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const match = cookieHeader.match(/access_token=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
    
    return null;
}

/**
 * Create secure cookie options for tokens
 */
export function createSecureCookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        secure: false, // Allow cookies over HTTP for development
        sameSite: 'strict' as const,
        path: '/',
        maxAge
    };
}