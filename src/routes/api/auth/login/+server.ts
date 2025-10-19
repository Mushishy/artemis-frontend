import { json, type RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { activeSessions } from '$lib/server/sessions';
import { randomBytes } from 'crypto';
import { SERVER_API_ENDPOINTS } from '$lib/api/settings/settings-server';

// Generate a secure random session ID
function generateSessionId(): string {
    return randomBytes(32).toString('hex');
}

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { apiKey } = await request.json();

        if (!apiKey?.trim()) {
            return json({ error: 'API key is required' }, { status: 400 });
        }

        // Handle potential URL encoding in API key
        let cleanApiKey = apiKey.trim();
        try {
            const decodedKey = decodeURIComponent(cleanApiKey);
            if (decodedKey !== cleanApiKey) {
                cleanApiKey = decodedKey;
            }
        } catch (e) {
            // If decoding fails, use original key
        }

        // Validate the API key by making a request to the Ludus API using axios
        const ludusUrl = SERVER_API_ENDPOINTS.ludus.server;
        
        let validationResponse;
        try {
            // Use axios for better SSL handling
            const axios = (await import('axios')).default;
            const https = await import('https');
            
            const httpsAgent = new https.Agent({
                rejectUnauthorized: false // Allow self-signed certificates
            });
            
            validationResponse = await axios.get(ludusUrl, {
                headers: {
                    'X-API-Key': cleanApiKey,
                    'Accept': 'application/json'
                },
                httpsAgent: ludusUrl.startsWith('https:') ? httpsAgent : undefined,
                timeout: 10000 // 10 second timeout
            });

        } catch (validationError: any) {
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

        // Generate session ID and encrypt the API key for client access
        const sessionId = generateSessionId();
        
        // Simple client-side compatible encryption
        const key = 'artemis-frontend-2024-key';
        let encrypted = '';
        for (let i = 0; i < cleanApiKey.length; i++) {
            encrypted += String.fromCharCode(
                cleanApiKey.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        const encryptedApiKey = Buffer.from(encrypted).toString('base64');
        
        // Store session (7 days expiry)
        const expires = Date.now() + (7 * 24 * 60 * 60 * 1000);
        activeSessions.set(sessionId, {
            apiKey: cleanApiKey,
            expires
        });

        // Set HTTP-only cookie with encrypted session
        cookies.set('session_id', sessionId, {
            httpOnly: true,
            secure: !dev,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        });

        // Set encrypted API key cookie (readable by client for API calls)
        cookies.set('api_key', encryptedApiKey, {
            httpOnly: false, // Accessible by JavaScript for API calls
            secure: !dev,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        });

        return json({ success: true });

    } catch (error) {
        console.error('Login error:', error);
        return json({ error: 'Authentication failed' }, { status: 500 });
    }
};