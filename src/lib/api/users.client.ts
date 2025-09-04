import { getLudusClient, getDulusClient, getLudusAdminClient } from './api-client';
import { cleanUsername, transformUsernamesToBatch } from '$lib/utils';
import type { User, UserCheckResult, UserCheckResponse, UserExistsCheck, UsersCheckResponse } from './types';

// Get the appropriate clients
const usersLudusClient = getLudusClient();
const usersAdminLudusClient = getLudusAdminClient()
const usersDulusClient = getDulusClient();

// Get all users
export async function getUsers(): Promise<User[]> {
    try {
        const response = await usersLudusClient.get('/user/all');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

// Create a new user
export async function createUser(name: string, isAdmin: boolean): Promise<User> {
    try {
        const userID = cleanUsername(name);
        
        const response = await usersAdminLudusClient.post('/user', {
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

// Download WireGuard configuration for a user
export async function downloadWireGuardConfig(userID: string): Promise<void> {
    try {
        const response = await usersLudusClient.get('/user/wireguard', {
            params: { userID }
        });
        const config = response.data.result.wireGuardConfig;
        
        const blob = new Blob([config], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${userID}.conf`;
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error downloading WireGuard config:', error);
        throw error;
    }
}

// Delete a user
export async function deleteUser(userID: string): Promise<void> {
    try {
        await usersAdminLudusClient.delete(`/user/${userID}`);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// Check if users exist (using dulus API)
export async function checkUsers(userIds: string[]): Promise<UserCheckResponse> {
    try {
        const response = await usersDulusClient.post('/users/check', {
            userIds: userIds
        });
        return response.data;
    } catch (error) {
        console.error('Error checking users:', error);
        throw error;
    }
}

// Check if users exist in pools/topologies (consolidating checkUsersInTopologies from pools.client)
export async function checkUsersInPools(userIds: string[]): Promise<UserExistsCheck[]> {
    try {
        const response = await usersDulusClient.post('/pool/users', {
            userIds: userIds
        });
        return response.data;
    } catch (error) {
        console.error('Error checking users in pools:', error);
        throw error;
    }
}

// Check if all pool users exist (consolidating checkPoolUsers from pools.client)
export async function checkPoolUsers(poolId: string): Promise<UsersCheckResponse> {
    try {
        const response = await usersDulusClient.get('/users/check', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool users:', error);
        throw error;
    }
}

// Import missing users for a pool (consolidating importMissingUsers from pools.client)
export async function importMissingUsers(poolId: string): Promise<void> {
    try {
        await usersDulusClient.post('/users/import', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error importing missing users:', error);
        throw error;
    }
}

// Create/import users (using dulus API)
export async function importUsers(userIds: string[]): Promise<void> {
    try {
        await usersDulusClient.post('/users/import', {
            userIds: userIds
        });
    } catch (error) {
        console.error('Error importing users:', error);
        throw error;
    }
}

// Delete multiple users
export async function deleteMultipleUsers(userIDs: string[]): Promise<void> {
    try {
        const response = await usersDulusClient.post('/users/delete', {
            userIds: userIDs
        });
        
        if (!response.data) {
            throw new Error('Failed to delete users');
        }
    } catch (error) {
        console.error('Error deleting multiple users:', error);
        throw error;
    }
}
