import axios, { type AxiosInstance } from 'axios';
import {
    API_ENDPOINTS,
} from './settings-client';

/**
 * Client-side API client factory for Dulus and Ludus APIs
 * This is exclusively for client-side usage (browser environment)
 * For server-side usage, use server-api-client.ts instead
 */
export class ApiClientFactory {
    private static dulusClient: AxiosInstance | null = null;
    private static ludusClient: AxiosInstance | null = null;
    private static ludusAdminClient: AxiosInstance | null = null;
    private static internalApiClient: AxiosInstance | null = null;

    static getDulusClient(): AxiosInstance {
        if (!this.dulusClient) {
            const config = {
                baseURL: API_ENDPOINTS.dulus.client,
                headers: {
                    'Accept': 'application/json',
                }
            };

            this.dulusClient = axios.create(config);

            // No need for client-side auth headers - server proxy handles JWT → API key conversion
        }
        return this.dulusClient;
    }

    static getLudusClient(): AxiosInstance {
        if (!this.ludusClient) {
            const config = {
                baseURL: API_ENDPOINTS.ludus.client,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            this.ludusClient = axios.create(config);

            // No need for client-side auth headers - server proxy handles JWT → API key conversion
        }
        return this.ludusClient;
    }

    static getLudusAdminClient(): AxiosInstance {
        if (!this.ludusAdminClient) {
            const config = {
                baseURL: API_ENDPOINTS.ludusAdmin.client,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            this.ludusAdminClient = axios.create(config);

            // No need for client-side auth headers - server proxy handles JWT → API key conversion
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
}

export const getDulusClient = () => ApiClientFactory.getDulusClient();
export const getLudusClient = () => ApiClientFactory.getLudusClient();
export const getLudusAdminClient = () => ApiClientFactory.getLudusAdminClient();
export const getInternalApiClient = () => ApiClientFactory.getInternalApiClient();
