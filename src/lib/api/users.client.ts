import axios from 'axios';
import { ludusBaseUrl, ludusPort, ludusApiKey, dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

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

export interface UserCheckResult {
    userId: string;
    exists: boolean;
}

export interface UserCheckResponse {
    results: UserCheckResult[];
}

// Check if users exist (using dulus API)
export async function checkUsers(userIds: string[]): Promise<UserCheckResponse> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/users/check`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': dulusApiKey
            },
            body: JSON.stringify({
                userIds: userIds
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error checking users:', error);
        throw error;
    }
}

// Create/import users (using dulus API)
export async function importUsers(userIds: string[]): Promise<void> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/users/import`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': dulusApiKey
            },
            body: JSON.stringify({
                userIds: userIds
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error importing users:', error);
        throw error;
    }
}

// Helper function to transform usernames to BATCH format
// Transform usernames to BATCH format for API
export function transformUsernamesToBatch(usernames: string[]): string[] {
    return usernames.map(username => {
        // Remove all spaces and convert to lowercase, then add BATCH prefix
        const cleanUsername = username.replace(/\s+/g, '').toLowerCase();
        return `BATCH${cleanUsername}`;
    });
}
