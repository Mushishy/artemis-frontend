/**
 * Server-side pools API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerDulusClient } from './server-api-client';
import { formatDate } from '$lib/utils';
import type { Pool, PoolStatusResponse, UsersCheckResponse } from './types';

// Load pools from API
export async function loadPools(): Promise<Pool[]> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/pool');
        
        const pools = response.data;
        const poolsArray = Array.isArray(pools) ? pools : [pools];
        
        // Ensure undefined values are converted to appropriate defaults
        return poolsArray.map(pool => ({
            ...pool,
            note: pool.note || "",
            ctfdData: Boolean(pool.ctfdData),
            createdAt: pool.createdAt ? formatDate(pool.createdAt) : ""
        }));
    } catch (error) {
        console.error('Error loading pools:', error);
        throw error;
    }
}

// Delete a pool
export async function deletePool(poolId: string): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        await dulusClient.delete('/pool', { params: { poolId } });
    } catch (error) {
        console.error('Error deleting pool:', error);
        throw error;
    }
}

// Update pool note
export async function updatePoolNote(poolId: string, note: string): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        await dulusClient.patch('/pool/note', { note }, { params: { poolId } });
    } catch (error) {
        console.error('Error updating pool note:', error);
        throw error;
    }
}

// Check pool status before deletion
export async function checkPoolStatus(poolId: string): Promise<PoolStatusResponse> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/range/status', { params: { poolId } });
        return response.data;
    } catch (error) {
        console.error('Error checking pool status:', error);
        throw error;
    }
}

// Unshare a shared pool
export async function unsharePool(poolId: string, mainUser: string): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        
        // Step 1: Send unshare request
        await dulusClient.post('/range/unshare', '', { 
            params: { poolId, targetId: mainUser }
        });

        // Step 2: Verify unshare was successful
        const checkResponse = await dulusClient.get('/range/shared', { 
            params: { poolId, targetId: mainUser }
        });
        
        if (checkResponse.data.unshared !== true) {
            throw new Error('Unshare verification failed - pool is still shared');
        }
    } catch (error) {
        console.error('Error unsharing pool:', error);
        throw error;
    }
}

// Delete users in a pool
export async function deletePoolUsers(poolId: string): Promise<void> {
    try {
        const dulusClient = getServerDulusClient();
        await dulusClient.post('/users/delete', '', { params: { poolId } });
    } catch (error) {
        console.error('Error deleting pool users:', error);
        throw error;
    }
}

// Check if users exist in a pool
export async function checkUsersExist(poolId: string): Promise<UsersCheckResponse> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/users/check', { params: { poolId } });
        return response.data;
    } catch (error) {
        console.error('Error checking users exist:', error);
        throw error;
    }
}

// Get pool details (including mainUser)
export async function getPoolDetail(poolId: string): Promise<any> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/pool', { 
            params: { poolId, userIds: false }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting pool details:', error);
        throw error;
    }
}
