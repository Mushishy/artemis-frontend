/**
 * User management API client
 * Handles all user-related operations across Ludus and Dulus APIs
 */

import { getLudusClient, getDulusClient, getLudusAdminClient } from './api-client';
import { cleanUsername } from '$lib/utils';
import type { 
    User, 
    UserCheckResponse, 
    UserExistsCheck, 
    UsersCheckResponse, 
    LudusLogResponse 
} from './types';

// API clients
const ludusClient = getLudusClient();
const ludusAdminClient = getLudusAdminClient();
const dulusClient = getDulusClient();

// ============================================================================
// USER MANAGEMENT (Ludus API)
// ============================================================================

/**
 * Get all users from Ludus
 */
export async function getUsers(): Promise<User[]> {
    try {
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
        const response = await ludusClient.get('/range/logs', {
            params: { userID: userId, tail, resumeline }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user logs:', error);
        throw error;
    }
}

/**
 * Download user logs as file
 */
export async function downloadUserLogs(poolId: string, userId: string): Promise<void> {
    try {
        const response = await ludusClient.get('/range/logs', {
            params: { userID: userId, tail: 100, resumeline: 0 }
        });

        const logs = response.data;
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${userId}_logs.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading user logs:', error);
        throw error;
    }
}

/**
 * Download WireGuard configuration for a user
 */
export async function downloadWireGuardConfig(userID: string): Promise<void> {
    try {
        const response = await ludusClient.get('/user/wireguard', {
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


