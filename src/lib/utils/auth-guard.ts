import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { verifyToken } from './jwt-auth';
import { createHash, createDecipheriv } from 'crypto';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * Decrypt API key using AES-256-GCM
 */
function decryptApiKey(encryptedData: string): string {
    const encryptionSecret = privateEnv.PRIVATE_JWT_SECRET;
    if (!encryptionSecret) {
        throw new Error('PRIVATE_JWT_SECRET environment variable is required for decryption');
    }
    const encryptionKey = createHash('sha256').update(encryptionSecret).digest();
    
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
 * Server-side authentication guard using JWT
 * Redirects to home page if user is not authenticated
 * Returns the Ludus API key for authenticated users
 */
export async function requireAuth(event: RequestEvent): Promise<string> {
    const accessToken = event.cookies.get('access_token');
    
    if (!accessToken) {
        throw redirect(302, '/');
    }

    try {
        const payload = await verifyToken(accessToken);        
        if (!payload || payload.type !== 'access' || !payload.apiKey) {
            throw redirect(302, '/');
        }
        
        // Decrypt the AES encrypted API key from JWT payload (SECURE!)
        try {
            const decryptedApiKey = decryptApiKey(payload.apiKey);
            return decryptedApiKey;
        } catch (error) {
            console.error('🔒 requireAuth: API key decryption failed:', error);
            throw error;
        }
    } catch (error) {
        console.error('🔒 JWT validation error:', error);
        throw redirect(302, '/');
    }
}

/**
 * Check if user is authenticated without throwing redirect
 * Returns API key if authenticated, null otherwise
 */
export async function getAuthenticatedApiKey(event: RequestEvent): Promise<string | null> {
    const accessToken = event.cookies.get('access_token');
    
    if (!accessToken) {
        return null;
    }

    try {
        const payload = await verifyToken(accessToken);
        
        if (!payload || payload.type !== 'access' || !payload.apiKey) {
            return null;
        }
        
                // Decrypt the AES encrypted API key from JWT payload (SECURE!)
        try {
            const decryptedApiKey = decryptApiKey(payload.apiKey);
            return decryptedApiKey;
        } catch (error) {
            console.error('🔒 getAuthenticatedApiKey: API key decryption failed:', error);
            return null;
        }
    } catch (error) {
        console.error('JWT validation error:', error);
        return null;
    }
}

/**
 * Get current authenticated user from JWT token
 * Returns user info if authenticated, null otherwise
 */
export async function getCurrentUser(event: RequestEvent) {
    const accessToken = event.cookies.get('access_token');
    
    if (!accessToken) {
        return null;
    }
    
    try {
        const payload = await verifyToken(accessToken);
        
        if (!payload || payload.type !== 'access') {
            return null;
        }
        
        return {
            username: payload.username
        };
    } catch (error) {
        console.error('JWT validation error:', error);
        return null;
    }
}