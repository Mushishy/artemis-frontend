import axios, { type AxiosInstance } from 'axios';
import https from 'https';
import { SERVER_API_ENDPOINTS, serverApiKey } from './server-settings';

// Create HTTPS agent for self-signed certificates (server-side only)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Server-side API client factory for Dulus and Ludus APIs
 * This is exclusively for server-side usage (in .server.ts files)
 * Handles self-signed HTTPS certificates and uses server API keys
 */
class ServerApiClientFactory {
    private static dulusClient: AxiosInstance | null = null;
    private static ludusClient: AxiosInstance | null = null;
    private static ludusAdminClient: AxiosInstance | null = null;

    static getDulusClient(): AxiosInstance {
        if (!this.dulusClient) {
            const config = {
                baseURL: SERVER_API_ENDPOINTS.dulus.server,
                headers: {
                    'Accept': 'application/json',
                    'X-API-Key': serverApiKey
                },
                httpsAgent
            };

            this.dulusClient = axios.create(config);
        }
        return this.dulusClient;
    }

    static getLudusClient(): AxiosInstance {
        if (!this.ludusClient) {
            const config = {
                baseURL: SERVER_API_ENDPOINTS.ludus.server,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': serverApiKey
                },
                httpsAgent
            };

            this.ludusClient = axios.create(config);
        }
        return this.ludusClient;
    }

    static getLudusAdminClient(): AxiosInstance {
        if (!this.ludusAdminClient) {
            const config = {
                baseURL: SERVER_API_ENDPOINTS.ludusAdmin.server,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': serverApiKey
                },
                httpsAgent
            };

            this.ludusAdminClient = axios.create(config);
        }
        return this.ludusAdminClient;
    }
}

// Export simplified functions for server-side usage
export const getServerDulusClient = () => ServerApiClientFactory.getDulusClient();
export const getServerLudusClient = () => ServerApiClientFactory.getLudusClient();
export const getServerLudusAdminClient = () => ServerApiClientFactory.getLudusAdminClient();
