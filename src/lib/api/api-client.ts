import axios, { type AxiosInstance } from 'axios';
import { dulusBaseUrl, dulusPort, ludusBaseUrl, ludusPort, ludusAdminPort, ludusApiKey, dulusApiKey } from './settings';

// Check if we're running in a server environment
const isServer = typeof window === 'undefined';
const isDev = import.meta.env.DEV;

let https: any;
if (isServer) {
    https = await import('https');
}

// Create HTTPS agent for self-signed certificates (server-side only)
const httpsAgent = isServer ? new https.Agent({
    rejectUnauthorized: false
}) : undefined;

/**
 * Centralized API client factory - works on both client and server
 */
export class ApiClientFactory {
    private static dulusClient: AxiosInstance | null = null;
    private static ludusClient: AxiosInstance | null = null;
    private static ludusAdminClient: AxiosInstance | null = null;
    private static internalApiClient: AxiosInstance | null = null;

    /**
     * Get Dulus API client (works on both client and server)
     */
    static getDulusClient(): AxiosInstance {
        if (!this.dulusClient) {
            const config: any = {
                // Use proxy in dev mode when in browser, direct URL otherwise
                baseURL: isServer ? `${dulusBaseUrl}:${dulusPort}` : (isDev ? '/proxy/dulus' : `${dulusBaseUrl}:${dulusPort}`),
                headers: {
                    'Accept': 'application/json',
                    'X-API-Key': dulusApiKey,
                },
            };
            
            // Only add httpsAgent for server-side HTTPS requests
            if (isServer && httpsAgent && dulusBaseUrl.startsWith('https')) {
                config.httpsAgent = httpsAgent;
            }
            
            this.dulusClient = axios.create(config);
        }
        return this.dulusClient;
    }

    /**
     * Get Ludus API client (works on both client and server)
     */
    static getLudusClient(): AxiosInstance {
        if (!this.ludusClient) {
            const config: any = {
                // Use proxy in dev mode when in browser, direct URL otherwise
                baseURL: isServer ? `${ludusBaseUrl}:${ludusPort}` : (isDev ? '/proxy/ludus' : `${ludusBaseUrl}:${ludusPort}`),
                headers: {
                    'X-API-Key': ludusApiKey,
                    'Content-Type': 'application/json'
                },
            };
            
            // Only add httpsAgent for server-side HTTPS requests
            if (isServer && httpsAgent) {
                config.httpsAgent = httpsAgent;
            }
            
            this.ludusClient = axios.create(config);
        }
        return this.ludusClient;
    }

    /**
     * Get Ludus Admin API client (works on both client and server)
     */
    static getLudusAdminClient(): AxiosInstance {
        if (!this.ludusAdminClient) {
            const config: any = {
                // Use proxy in dev mode when in browser, direct URL otherwise
                baseURL: isServer ? `${ludusBaseUrl}:${ludusAdminPort}` : (isDev ? '/proxy/ludus-admin' : `${ludusBaseUrl}:${ludusAdminPort}`),
                headers: {
                    'X-API-Key': ludusApiKey,
                    'Content-Type': 'application/json'
                },
            };
            
            // Only add httpsAgent for server-side HTTPS requests
            if (isServer && httpsAgent) {
                config.httpsAgent = httpsAgent;
            }
            
            this.ludusAdminClient = axios.create(config);
        }
        return this.ludusAdminClient;
    }

    /**
     * Get internal API client (for calling our own API routes)
     */
    static getInternalApiClient(): AxiosInstance {
        if (!this.internalApiClient) {
            this.internalApiClient = axios.create({
                baseURL: '',  // Use same origin
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        return this.internalApiClient;
    }

    /**
     * Check if running on server
     */
    static isServer(): boolean {
        return isServer;
    }
}

// Export convenience methods
export const getDulusClient = () => ApiClientFactory.getDulusClient();
export const getLudusClient = () => ApiClientFactory.getLudusClient();
export const getLudusAdminClient = () => ApiClientFactory.getLudusAdminClient();
export const getInternalApiClient = () => ApiClientFactory.getInternalApiClient();
export const isServerEnvironment = () => ApiClientFactory.isServer();
