import { json, type RequestHandler } from '@sveltejs/kit';
import { SERVER_API_ENDPOINTS } from '$lib/api/settings/settings-server';
import { createAuthToken, createSecureCookieOptions, encryptApiKey } from '$lib/utils/jwt-auth';

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

        // Encrypt the API key
        const encryptedApiKey = encryptApiKey(cleanApiKey);
        
        // Create single JWT token with encrypted API key
        const authToken = await createAuthToken(username, encryptedApiKey);
        
        // Set secure HTTP-only cookie for single token
        const cookieOptions = createSecureCookieOptions(24 * 60 * 60); // 1 day
        cookies.set('auth_token', authToken, cookieOptions);

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