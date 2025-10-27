import { cleanUsername } from '$lib/utils/helper';
import { getLudusClient, getDulusClient, getLudusAdminClient } from '../settings/api-client';
import type { User, UsersCheckResponse, LudusLogResponse } from '../types';

const ludusClient = getLudusClient();
const ludusAdminClient = getLudusAdminClient();
const dulusClient = getDulusClient();

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

export async function deleteUser(userID: string): Promise<void> {
    try {
        await ludusAdminClient.delete(`/user/${userID}`);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

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

export async function deletePoolUsers(poolId: string): Promise<void> {
    try {
        const client = getDulusClient();
        await client.post('/users/delete', '', { params: { poolId } });
    } catch (error) {
        console.error('Error deleting pool users:', error);
        throw error;
    }
}

// MERGE?
// Check if all pool users exist
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

// Check if users exist in a pool
export async function checkUsersExist(poolId: string): Promise<UsersCheckResponse> {
    try {
        const client = getDulusClient();
        const response = await client.get('/users/check', { params: { poolId } });
        return response.data;
    } catch (error) {
        console.error('Error checking users exist:', error);
        throw error;
    }
}