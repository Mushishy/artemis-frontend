import axios from 'axios';
import https from 'https';
import { ludusBaseUrl, ludusPort, ludusApiKey } from './settings';

// Configure axios with SSL certificate handling for self-signed certificates (server-side only)
const usersServerClient = axios.create({
    baseURL: `${ludusBaseUrl}:${ludusPort}`,
    headers: {
        'X-API-KEY': ludusApiKey,
        'Content-Type': 'application/json'
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

export interface User {
    name: string;
    userID: string;
    dateCreated: string;
    isAdmin: boolean;
}

// Get all users (server-side only)
export async function getUsers(): Promise<User[]> {
    try {
        const response = await usersServerClient.get('/user/all');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

// Get WireGuard configuration for a user (server-side only)
export async function getWireGuardConfig(userID: string): Promise<string> {
    try {
        const response = await usersServerClient.get('/user/wireguard', {
            params: { userID }
        });
        return response.data.result.wireGuardConfig;
    } catch (error) {
        console.error('Error fetching WireGuard configuration:', error);
        throw error;
    }
}
