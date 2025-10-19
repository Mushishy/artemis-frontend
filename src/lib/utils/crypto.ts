import { randomBytes } from 'crypto';

/**
 * Generate a secure random session ID
 */
export function generateSessionId(): string {
    return randomBytes(32).toString('hex');
}

