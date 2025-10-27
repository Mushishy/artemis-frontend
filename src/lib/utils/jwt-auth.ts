import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env as privateEnv } from '$env/dynamic/private';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// JWT configuration - MUST be set in environment variables
const JWT_SECRET_KEY = privateEnv.PRIVATE_JWT_SECRET;
const ENCRYPTION_SECRET_KEY = privateEnv.PRIVATE_ENCRYPTION_SECRET;

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);
const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'artemis-frontend';
const JWT_AUDIENCE = 'artemis-users';

// Token expiration time - single long-lived token
export const TOKEN_EXPIRY = '12h'; // 12 hours

export interface AuthTokenPayload extends JWTPayload {
    username: string;
    apiKey: string; // Encrypted API key stored directly in JWT
}

/**
 * Create a signed JWT token
 */
export async function createToken(
    payload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
    expiresIn: string = TOKEN_EXPIRY
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
 * Create a single auth token with encrypted API key
 */
export async function createAuthToken(username: string, encryptedApiKey: string): Promise<string> {
    return createToken({ username, apiKey: encryptedApiKey });
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

/**
 * Encrypt API key using AES-256-GCM
 */
export function encryptApiKey(apiKey: string): string {
    const encryptionKey = createHash('sha256').update(ENCRYPTION_SECRET_KEY).digest();
    
    // Generate random IV for each encryption
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Combine IV + auth tag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt API key using AES-256-GCM
 */
export function decryptApiKey(encryptedData: string): string {
    const encryptionKey = createHash('sha256').update(ENCRYPTION_SECRET_KEY).digest();
    
    // Split the encrypted data: iv:authTag:encryptedData
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted API key format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(cookies: any) {
    const clearOptions = {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 0 // Expire immediately
    };
    
    cookies.set('auth_token', '', clearOptions);
    cookies.delete('auth_token', { path: '/' });
}