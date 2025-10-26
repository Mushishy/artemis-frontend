import { getDulusClient } from '../settings/api-client';
import { checkPoolUsers } from './users.client';
import { getPoolFlags } from './ctfd.client';
import { formatDate } from '$lib/utils';
import type { Pool, UserExistsCheck } from '../types';
import type { 
    PoolRequest, 
    StatusCheckResponse, 
    PoolDetail,
    PoolHealthCheck,
    PoolDetailData,
    PatchUserRequest,
    TopologyCheckResponse
} from '../types';

const dulusClient = getDulusClient();

export async function createPool(poolData: PoolRequest) {
    try {
        const cleanedData: any = {
            type: poolData.type,
            topologyId: poolData.topologyId,
            note: poolData.note || '' // Required field
        };

        if (poolData.type === 'SHARED' && poolData.mainUser) {
            cleanedData.mainUser = poolData.mainUser;
        }

        if (poolData.usersAndTeams && poolData.usersAndTeams.length > 0) {
            cleanedData.usersAndTeams = poolData.usersAndTeams.map(item => {
                const cleanedItem: any = { user: item.user };
                if (item.team && item.team.trim() !== '') {
                    cleanedItem.team = item.team;
                }
                return cleanedItem;
            });
        }

        const response = await dulusClient.post('/pool', cleanedData);
        return response.data;
    } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
    }
}

export async function getPoolDetail(poolId: string): Promise<PoolDetail> {
    try {
        const response = await dulusClient.get('/pool', {
            params: { poolId, userIds: false }
        });
        return response.data;
    } catch (error) {
        console.error('Error loading pool detail:', error);
        throw error;
    }
}

export async function patchPoolUsers(poolId: string, usersAndTeams: PatchUserRequest[]): Promise<any> {
    try {
        const response = await dulusClient.patch('/pool/users', 
            { usersAndTeams }, 
            { params: { poolId } }
        );
        return response.data;
    } catch (error) {
        console.error('Error patching pool users:', error);
        throw error;
    }
}

export async function checkPoolStatus(poolId: string): Promise<StatusCheckResponse> {
    try {
        const response = await dulusClient.get('/range/status', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool status:', error);
        throw error;
    }
}

export async function checkPoolHealth(poolId: string): Promise<PoolHealthCheck> {
    try {
        const [usersResult, topologyResult, statusResult] = await Promise.allSettled([
            checkPoolUsers(poolId),
            checkPoolTopology(poolId),
            checkPoolStatus(poolId)
        ]);
        
        return {
            users: usersResult.status === 'fulfilled' ? usersResult.value : null,
            topology: topologyResult.status === 'fulfilled' ? topologyResult.value : null,
            status: statusResult.status === 'fulfilled' ? statusResult.value : null,
            isLoading: false
        };
    } catch (error) {
        console.error('Error checking pool health:', error);
        return {
            users: null,
            topology: null,
            status: null,
            isLoading: false
        };
    }
}

export async function setPoolTopology(poolId: string): Promise<void> {
    try {
        await dulusClient.post('/range/config', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error setting pool topology:', error);
        throw error;
    }
}

export async function changePoolTopology(poolId: string, topologyId: string): Promise<void> {
    try {
        await dulusClient.patch('/pool/topology', { topologyId }, {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error changing pool topology:', error);
        throw error;
    }
}

export async function deployPool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/deploy', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error deploying pool:', error);
        throw error;
    }
}

export async function redeployPool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/redeploy', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error redeploying pool:', error);
        throw error;
    }
}

export async function abortPool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/abort', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error aborting pool operations:', error);
        throw error;
    }
}

export async function removePool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/remove', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error removing pool:', error);
        throw error;
    }
}

export async function downloadWireguardConfigs(poolId: string, downloadFileName: string = 'wireguard-configs.zip'): Promise<void> {
    try {
        const response = await dulusClient.get('/range/access', {
            params: { poolId }
            // No need for responseType: 'arraybuffer' anymore since we're getting JSON
        });
        
        // Extract base64 data from JSON response
        const { data: base64Data, filename, size } = response.data;
        
        if (!base64Data) {
            throw new Error('No ZIP data received from server');
        }
        
        // Decode base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob from binary data
        const blob = new Blob([bytes], { type: 'application/zip' });
        
        // Verify blob size matches
        if (blob.size !== size) {
            console.warn(`Size mismatch: expected ${size}, got ${blob.size}`);
        }
        
        // Create object URL and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || downloadFileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading Wireguard configs:', error);        
        throw error;
    }
}

export async function checkSharingStatus(poolId: string, targetId: string): Promise<{ shared: boolean }> {
    try {
        const response = await dulusClient.get('/range/shared', {
            params: { poolId, targetId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking sharing status:', error);
        throw error;
    }
}

export async function sharePool(poolId: string, targetId: string): Promise<{ results: Array<{ userId: string; response: { result?: string; error?: string } }> }> {
    try {
        const response = await dulusClient.post('/range/share', '', {
            params: { poolId, targetId }
        });
        return response.data;
    } catch (error) {
        console.error('Error sharing pool:', error);
        throw error;
    }
}

export async function unsharePool(poolId: string, targetId: string): Promise<{ results: Array<{ userId: string; response: { result?: string; error?: string } }> }> {
    try {
        const response = await dulusClient.post('/range/unshare', '', {
            params: { poolId, targetId }
        });
        return response.data;
    } catch (error) {
        console.error('Error unsharing pool:', error);
        throw error;
    }
}

export async function getPoolTopology(poolId: string): Promise<boolean> {
    try {
        const result = await checkPoolTopology(poolId);
        return result.matchPoolTopology || false;
    } catch (error) {
        console.error('Error loading pool topology:', error);
        throw error;
    }
}

export async function getPoolStatus(poolId: string): Promise<string> {
    try {
        const result = await checkPoolStatus(poolId);
        return result.allDeployed ? 'DEPLOYED' : 'NOT_DEPLOYED';
    } catch (error) {
        console.error('Error loading pool status:', error);
        return 'Unknown';
    }
}

export async function refreshPoolData(poolId: string): Promise<PoolDetailData> {
    try {
        const [topology, status, flags] = await Promise.allSettled([
            getPoolTopology(poolId),
            getPoolStatus(poolId),
            getPoolFlags(poolId)
        ]);

        return {
            users: true,
            topology: topology.status === 'fulfilled' ? topology.value : null,
            status: status.status === 'fulfilled' ? status.value : null,
            flags: flags.status === 'fulfilled' ? flags.value : null,
            isLoading: false
        };
    } catch (error) {
        console.error('Error refreshing pool data:', error);
        return {
            users: null,
            topology: null,
            status: null,
            flags: null,
            isLoading: false
        };
    }
}

export async function checkPoolTopology(poolId: string): Promise<TopologyCheckResponse> {
    try {
        const response = await dulusClient.get('/range/config', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool topology:', error);
        throw error;
    }
}

export async function loadPools(): Promise<Pool[]> {
    try {
        const client = getDulusClient();
        const response = await client.get('/pool');
        
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
        const client = getDulusClient();
        await client.delete('/pool', { params: { poolId } });
    } catch (error) {
        console.error('Error deleting pool:', error);
        throw error;
    }
}

// Update pool note
export async function updatePoolNote(poolId: string, note: string): Promise<void> {
    try {
        const client = getDulusClient();
        await client.patch('/pool/note', { note }, { params: { poolId } });
    } catch (error) {
        console.error('Error updating pool note:', error);
        throw error;
    }
}

// Unshare a shared pool
export async function unshareSharedPool(poolId: string, mainUser: string): Promise<void> {
    try {
        const client = getDulusClient();
        
        // Step 1: Send unshare request
        await client.post('/range/unshare', '', { 
            params: { poolId, targetId: mainUser }
        });

        // Step 2: Verify unshare was successful
        const checkResponse = await client.get('/range/shared', { 
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

export async function checkUsersInPools(userIds: string[]): Promise<UserExistsCheck[]> {
    try {
        const response = await dulusClient.get('/pool/users/exists', {
            params: { userIds: userIds.join(',') }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking users in pools:', error);
        throw error;
    }
}

// Testing API functions
export async function getTestingStatus(poolId: string): Promise<{ allSame: boolean; testingEnabled: boolean }> {
    try {
        const response = await dulusClient.get('/range/testing/status', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting testing status:', error);
        throw error;
    }
}

export async function startTesting(poolId: string): Promise<{ results: Array<{ userId: string; response: { status: string } }> }> {
    try {
        const response = await dulusClient.put('/range/testing/start', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error starting testing:', error);
        throw error;
    }
}

export async function stopTesting(poolId: string): Promise<{ results: Array<{ userId: string; response: { status: string } }> }> {
    try {
        const response = await dulusClient.put('/range/testing/stop', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error stopping testing:', error);
        throw error;
    }
}