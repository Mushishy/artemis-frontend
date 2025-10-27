import axios, { type AxiosInstance } from 'axios';
import https from 'https';
import { SERVER_API_ENDPOINTS } from './settings-server';

// Create HTTPS agent for self-signed certificates (always ignore)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Server-side API client factory for Dulus and Ludus APIs
 * This is exclusively for server-side usage (in .server.ts files)
 * Handles self-signed HTTPS certificates and uses user's session API keys
 */

export function createServerDulusClient(apiKey: string): AxiosInstance {
    const config = {
        baseURL: SERVER_API_ENDPOINTS.dulus.server,
        headers: {
            'Accept': 'application/json',
            'X-API-Key': apiKey
        },
        httpsAgent
    };

    return axios.create(config);
}

export function createServerLudusClient(apiKey: string): AxiosInstance {
    const config = {
        baseURL: SERVER_API_ENDPOINTS.ludus.server,
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
        },
        httpsAgent
    };

    return axios.create(config);
}