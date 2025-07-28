import axios from 'axios';
import { ludusBaseUrl, ludusPort, ludusApiKey } from './settings';

// Configure axios for browser compatibility (no https.Agent)
const usersClient = axios.create({
    baseURL: `${ludusBaseUrl}:${ludusPort}`,
    headers: {
        'X-API-KEY': ludusApiKey,
        'Content-Type': 'application/json'
    }
});

export interface User {
    name: string;
    userID: string;
    dateCreated: string;
    isAdmin: boolean;
}

// Get WireGuard configuration for a user (client-side)
export async function getWireGuardConfig(userID: string): Promise<string> {
    try {
        const response = await usersClient.get('/user/wireguard', {
            params: { userID }
        });
        return response.data.result.wireGuardConfig;
    } catch (error) {
        console.error('Error fetching WireGuard configuration:', error);
        throw error;
    }
}
