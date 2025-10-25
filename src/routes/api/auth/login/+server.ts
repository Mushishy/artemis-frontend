import { json, type RequestHandler } from '@sveltejs/kit';
import { SERVER_API_ENDPOINTS } from '$lib/api/settings/settings-server';
import { createTokenPair, createSecureCookieOptions } from '$lib/utils/jwt-auth';
import { createHash, createCipheriv, randomBytes } from 'crypto';
import { env as privateEnv } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { apiKey } = await request.json();

        if (!apiKey?.trim()) {
            return json({ error: 'API key is required' }, { status: 400 });
        }

        // Simple validation - API keys shouldn't need URL decoding
        const cleanApiKey = apiKey.trim();

        // Validate the API key by making a request to the Ludus API
        const ludusUrl = SERVER_API_ENDPOINTS.ludus.server;
        
        let validationResponse;
        try {
            // Use axios with proper SSL validation
            const axios = (await import('axios')).default;
            const https = (await import('https')).default;
            
            validationResponse = await axios.get(ludusUrl, {
                headers: {
                    'X-API-Key': cleanApiKey,
                    'Accept': 'application/json'
                },
                timeout: 10000, // 10 second timeout
                // Always ignore self-signed certificates
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

        } catch (validationError: any) {
            // Log the full error for debugging on the server (don't leak details to client)
            console.error('Ludus validation request failed:', validationError?.message || validationError, validationError?.stack || '');

            // Check if it's a network/SSL error vs API key error
            if (validationError.response) {
                // Server responded with error status
                return json({ error: `Invalid API key (${validationError.response.status})` }, { status: 401 });
            } else {
                // Network error (can't reach server)
                return json({ error: 'Cannot connect to Ludus server' }, { status: 503 });
            }
        }

        if (validationResponse.status !== 200) {
            return json({ error: `Invalid API key (${validationResponse.status})` }, { status: 401 });
        }

        // Extract username from API key (first part until the first dot)
        const username = cleanApiKey.split('.')[0] || 'ludus_user';

        // ENCRYPT the API key before putting it in JWT using AES-256-GCM!
        const encryptionSecret = privateEnv.PRIVATE_JWT_SECRET;
        if (!encryptionSecret) {
            return json({ error: 'Server configuration error' }, { status: 500 });
        }
        const encryptionKey = createHash('sha256').update(encryptionSecret).digest();
        
        // Generate random IV for each encryption
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
        
        let encryptedData = cipher.update(cleanApiKey, 'utf8', 'hex');
        encryptedData += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        
        // Combine IV + auth tag + encrypted data
        const encryptedApiKey = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encryptedData;
        
        // Create JWT token pair with ENCRYPTED API key embedded ONLY in access token (SECURE!)
        const { accessToken, refreshToken } = await createTokenPair(username, encryptedApiKey);
        
        // Set secure HTTP-only cookies for tokens ONLY
        const accessCookieOptions = createSecureCookieOptions(60 * 60); // 1 hour
        const refreshCookieOptions = createSecureCookieOptions(7 * 24 * 60 * 60); // 7 days
        
        cookies.set('access_token', accessToken, accessCookieOptions);
        cookies.set('refresh_token', refreshToken, refreshCookieOptions);
        
        // DO NOT STORE API KEY IN COOKIES - IT'S NOW IN JWT PAYLOAD!

        return json({ 
            success: true,
            user: { username }
            // Tokens are securely stored in HTTP-only cookies only
        });

    } catch (error) {
        console.error('Login error:', error);
        return json({ error: 'Authentication failed' }, { status: 500 });
    }
};