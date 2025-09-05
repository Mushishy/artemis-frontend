import { getDulusClient } from './api-client';
import type { 
    PoolRequest, 
    StatusCheckResponse, 
    PoolDetail,
    PoolHealthCheck,
    PoolDetailData,
    PatchUserRequest,
} from './types';

import { checkPoolUsers } from './users.client';
import { checkPoolTopology } from './topology.client';
import { getPoolFlags } from './ctfd.client';

const dulusClient = getDulusClient();

// ============================================================================
// POOL CREATION & MANAGEMENT
// ============================================================================

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

// ============================================================================
// POOL HEALTH & STATUS CHECKING
// ============================================================================

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

// ============================================================================
// POOL TOPOLOGY MANAGEMENT
// ============================================================================

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

// ============================================================================
// POOL DEPLOYMENT OPERATIONS
// ============================================================================

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

// ============================================================================
// POOL ACCESS & DOWNLOADS
// ============================================================================


export async function downloadWireguardConfigs(poolId: string): Promise<Blob> {
    try {
        const response = await dulusClient.get('/range/access', {
            params: { poolId },
            headers: { 'accept': 'application/zip' },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading Wireguard configs:', error);
        throw error;
    }
}

// ============================================================================
// POOL SHARING (for SHARED type pools)
// ============================================================================

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

export async function sharePool(poolId: string, targetId: string): Promise<void> {
    try {
        await dulusClient.post('/range/share', '', {
            params: { poolId, targetId }
        });
    } catch (error) {
        console.error('Error sharing pool:', error);
        throw error;
    }
}

export async function unsharePool(poolId: string, targetId: string): Promise<void> {
    try {
        await dulusClient.post('/range/unshare', '', {
            params: { poolId, targetId }
        });
    } catch (error) {
        console.error('Error unsharing pool:', error);
        throw error;
    }
}

// ============================================================================
// LEGACY & COMPATIBILITY FUNCTIONS
// ============================================================================

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

// ============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

export { checkUsersInPools, checkPoolUsers, importMissingUsers, downloadUserLogs, downloadUserWireguard } from './users.client';
export { getTopologies, downloadTopologyFile, checkPoolTopology } from './topology.client';
export { fetchCtfdData, downloadCtfdLogins, getPoolFlags } from './ctfd.client';

// Alternative names for compatibility
export const getPoolDetails = getPoolDetail;
