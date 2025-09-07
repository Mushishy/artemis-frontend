/**
 * Server-side user management API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerLudusClient, getServerLudusAdminClient, getServerDulusClient } from './server-api-client';
import { cleanUsername } from '$lib/utils';
import type { 
    User, 
    UserCheckResponse, 
    UserExistsCheck, 
    UsersCheckResponse, 
    LudusLogResponse 
} from './types';

// ============================================================================
// USER MANAGEMENT (Ludus API)
// ============================================================================

/**
 * Get all users from Ludus
 */
export async function getUsers(): Promise<User[]> {
    try {
        const ludusClient = getServerLudusClient();
        const response = await ludusClient.get('/user/all');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

/**
 * Create a new user in Ludus
 */
export async function createUser(name: string, isAdmin: boolean): Promise<User> {
    try {
        const ludusAdminClient = getServerLudusAdminClient();
        const userID = cleanUsername(name);
        const response = await ludusAdminClient.post('/user', {
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

/**
 * Delete a user from Ludus
 */
export async function deleteUser(userID: string): Promise<void> {
    try {
        const ludusAdminClient = getServerLudusAdminClient();
        await ludusAdminClient.delete(`/user/${userID}`);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

/**
 * Delete multiple users from Dulus
 */
export async function deleteMultipleUsers(userIDs: string[]): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.post('/users/delete', {
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

// ============================================================================
// USER VALIDATION & CHECKING
// ============================================================================

/**
 * Check if users exist in Dulus
 */
export async function checkUsers(userIds: string[]): Promise<UserCheckResponse> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.post('/users/check', { userIds });
        return response.data;
    } catch (error) {
        console.error('Error checking users:', error);
        throw error;
    }
}

/**
 * Check if users exist in pools/topologies
 */
export async function checkUsersInPools(userIds: string[]): Promise<UserExistsCheck[]> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.post('/pool/users', { userIds });
        return response.data;
    } catch (error) {
        console.error('Error checking users in pools:', error);
        throw error;
    }
}

/**
 * Check if all pool users exist
 */
export async function checkPoolUsers(poolId: string): Promise<UsersCheckResponse> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/users/check', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool users:', error);
        throw error;
    }
}

// ============================================================================
// USER IMPORT & MANAGEMENT
// ============================================================================

/**
 * Import missing users for a specific pool
 */
export async function importMissingUsers(poolId: string): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        await dulusClient.post('/users/import', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error importing missing users:', error);
        throw error;
    }
}

/**
 * Create/import users using Dulus API
 */
export async function importUsers(userIds: string[]): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        await dulusClient.post('/users/import', { userIds });
    } catch (error) {
        console.error('Error importing users:', error);
        throw error;
    }
}

// ============================================================================
// USER LOGS & CONFIGURATIONS
// ============================================================================

/**
 * Get user logs from Ludus
 */
export async function getUserLogs(userId: string, tail: number = 100, resumeline: number = 0): Promise<LudusLogResponse> {
    try {
        const ludusClient = getServerLudusClient();
        const response = await ludusClient.get('/range/logs', {
            params: { userID: userId, tail, resumeline }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user logs:', error);
        throw error;
    }
}
