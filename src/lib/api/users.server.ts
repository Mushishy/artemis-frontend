import axios from 'axios';
import https from 'https';
import { ludusBaseUrl, ludusAdminPort, ludusApiKey } from './settings';

// Configure axios with SSL certificate handling for self-signed certificates (server-side only)
const usersServerClient = axios.create({
    baseURL: `${ludusBaseUrl}:${ludusAdminPort}`,
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

// Create a new user (server-side only)
export async function createUser(name: string, isAdmin: boolean): Promise<User> {
    try {
        // Generate userID from name (remove spaces, keep letters and numbers, take first 10 chars)
        const userID = name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
        
        const response = await usersServerClient.post('/user', {
            name,
            userID,
            isAdmin
        });
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Delete a user (server-side only)
export async function deleteUser(userID: string): Promise<void> {
    try {
        await usersServerClient.delete(`/user/${userID}`);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Delete multiple users (server-side only)
export async function deleteMultipleUsers(userIDs: string[]): Promise<void> {
    try {
        await usersServerClient.delete('/user/bulk', {
            data: { userIDs }
        });
    } catch (error) {
        console.error('Error deleting multiple users:', error);
        throw error;
    }
}
