import axios, { type AxiosInstance } from 'axios';
import {
    ludusApiKey,
    dulusApiKey,
    API_ENDPOINTS
} from './settings';

// Environment detection
const isServer = typeof window === 'undefined';

// HTTPS agent for self-signed certificates (server-side only)
let httpsAgent: any;
if (isServer) {
    const https = await import('https');
    httpsAgent = new https.Agent({ rejectUnauthorized: false });
}

/**
 * Centralized API client factory for Dulus and Ludus APIs
 * Handles both client-side and server-side requests with proper proxying
 */
export class ApiClientFactory {
    private static dulusClient: AxiosInstance | null = null;
    private static ludusClient: AxiosInstance | null = null;
    private static ludusAdminClient: AxiosInstance | null = null;
    private static internalApiClient: AxiosInstance | null = null;

    static getDulusClient(): AxiosInstance {
        if (!this.dulusClient) {
            const baseURL = isServer ? API_ENDPOINTS.dulus.server : API_ENDPOINTS.dulus.client;

            const config: any = {
                baseURL,
                headers: {
                    'Accept': 'application/json',
                    'X-API-Key': dulusApiKey,
                },
            };

            if (isServer && httpsAgent && baseURL.startsWith('https')) {
                config.httpsAgent = httpsAgent;
            }

            this.dulusClient = axios.create(config);
        }
        return this.dulusClient;
    }

    static getLudusClient(): AxiosInstance {
        if (!this.ludusClient) {
            const baseURL = isServer ? API_ENDPOINTS.ludus.server : API_ENDPOINTS.ludus.client;

            const config: any = {
                baseURL,
                headers: {
                    'X-API-Key': ludusApiKey,
                    'Content-Type': 'application/json'
                },
            };

            if (isServer && httpsAgent && baseURL.startsWith('https')) {
                config.httpsAgent = httpsAgent;
            }

            this.ludusClient = axios.create(config);
        }
        return this.ludusClient;
    }

    static getLudusAdminClient(): AxiosInstance {
        if (!this.ludusAdminClient) {
            const baseURL = isServer ? API_ENDPOINTS.ludusAdmin.server : API_ENDPOINTS.ludusAdmin.client;

            const config: any = {
                baseURL,
                headers: {
                    'X-API-Key': ludusApiKey,
                    'Content-Type': 'application/json'
                },
            };

            if (isServer && httpsAgent && baseURL.startsWith('https')) {
                config.httpsAgent = httpsAgent;
            }

            this.ludusAdminClient = axios.create(config);
        }
        return this.ludusAdminClient;
    }

    static getInternalApiClient(): AxiosInstance {
        if (!this.internalApiClient) {
            this.internalApiClient = axios.create({
                baseURL: '',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        return this.internalApiClient;
    }

    static isServer(): boolean {
        return isServer;
    }
}

export const getDulusClient = () => ApiClientFactory.getDulusClient();
export const getLudusClient = () => ApiClientFactory.getLudusClient();
export const getLudusAdminClient = () => ApiClientFactory.getLudusAdminClient();
export const getInternalApiClient = () => ApiClientFactory.getInternalApiClient();
export const isServerEnvironment = () => ApiClientFactory.isServer();
