import { dulusBaseUrl, dulusPort, dulusApiKey } from "$lib/api/settings";
import { formatDate } from '$lib/utils';

export interface Pool {
    poolId: string;
    note?: string;
    createdBy: string;
    type: 'INDIVIDUAL' | 'SHARED' | 'CTFD';
    topologyId: string;
    ctfdData: boolean;
    createdAt: string;
    mainUser?: string;
}

export interface PoolStatusResult {
    userId: string;
    state: string;
    error?: string;
}

export interface PoolStatusResponse {
    results: PoolStatusResult[];
    allDeployed: boolean;
}

export interface UserCheckResponse {
    allExist: boolean;
    missingUserIds: string[];
}

// Load pools from API
export async function loadPools(): Promise<Pool[]> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const pools = await response.json();
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
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool?poolId=${poolId}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting pool:', error);
        throw error;
    }
}

// Update pool note
export async function updatePoolNote(poolId: string, note: string): Promise<void> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/note?poolId=${poolId}`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-API-Key': dulusApiKey
            },
            body: JSON.stringify({
                note: note
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error updating pool note:', error);
        throw error;
    }
}

// Check pool status before deletion
export async function checkPoolStatus(poolId: string): Promise<PoolStatusResponse> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/range/status?poolId=${poolId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking pool status:', error);
        throw error;
    }
}

// Unshare a shared pool
export async function unsharePool(poolId: string, mainUser: string): Promise<void> {
    try {
        // Step 1: Send unshare request
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/range/unshare?poolId=${poolId}&targetId=${mainUser}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            },
            body: ''
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Step 2: Verify unshare was successful
        const checkResponse = await fetch(`${dulusBaseUrl}:${dulusPort}/range/shared?poolId=${poolId}&targetId=${mainUser}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!checkResponse.ok) {
            throw new Error(`HTTP error! status: ${checkResponse.status}`);
        }

        const checkData = await checkResponse.json();
        
        if (checkData.unshared !== true) {
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
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/users/delete?poolId=${poolId}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey,
                'Content-Type': 'application/json'
            },
            body: ''
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting pool users:', error);
        throw error;
    }
}

// Check if users exist in a pool
export async function checkUsersExist(poolId: string): Promise<UserCheckResponse> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/users/check?poolId=${poolId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking users exist:', error);
        throw error;
    }
}

// Get pool details (including mainUser)
export async function getPoolDetail(poolId: string): Promise<any> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool?poolId=${poolId}&userIds=false`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting pool details:', error);
        throw error;
    }
}
