/**
 * Client-side crypto utilities for browser environment
 * Uses simpler encryption methods suitable for client-side use
 */

/**
 * Simple XOR-based encryption for client-side token storage
 * This provides basic obfuscation - not cryptographically secure but better than plain text
 */
export function encryptTokenClient(token: string): string {
    const key = 'artemis-frontend-2024-key'; // Consistent key for client-side
    let encrypted = '';
    
    for (let i = 0; i < token.length; i++) {
        encrypted += String.fromCharCode(
            token.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    
    return btoa(encrypted);
}

/**
 * Decrypt token on client-side
 */
export function decryptTokenClient(encryptedToken: string): string {
    try {
        const key = 'artemis-frontend-2024-key'; // Same key as encryption
        const encrypted = atob(encryptedToken); // Base64 decode
        let decrypted = '';
        
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(
                encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        
        return decrypted;
    } catch (error) {
        console.error('Client decryption error:', error);
        throw new Error('Failed to decrypt token');
    }
}

/**
 * Get API key from encrypted cookie
 */
export function getApiKeyFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const encryptedApiKey = document.cookie
        .split('; ')
        .find(row => row.startsWith('api_key='))
        ?.split('=')[1];
    
    if (!encryptedApiKey) return null;
    
    try {
        return decryptTokenClient(decodeURIComponent(encryptedApiKey));
    } catch (error) {
        console.error('Failed to decrypt API key from cookie:', error);
        return null;
    }
}