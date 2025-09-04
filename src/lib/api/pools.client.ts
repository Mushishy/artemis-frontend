import { getDulusClient, getLudusClient } from './api-client';
import type { 
    PoolRequest, 
    StatusCheckResponse, 
    PoolDetail,
    PoolHealthCheck,
    PoolDetailData,
    PatchUserRequest,
} from './types';

// Import for internal use in checkPoolHealth
import { checkPoolUsers } from './users.client';
import { checkPoolTopology } from './topology.client';

const apiClient = getDulusClient();
const ludusClient = getLudusClient();

export async function createPool(poolData: PoolRequest) {
    try {
        // Clean the pool data to remove undefined/empty values
        const cleanedData: any = {
            type: poolData.type,
            topologyId: poolData.topologyId,
            note: poolData.note || '' // Required field according to API spec
        };

        // Only add optional fields if they have actual values
        if (poolData.type == 'SHARED' && poolData.mainUser) {
            cleanedData.mainUser = poolData.mainUser;
        }

        if (poolData.usersAndTeams && poolData.usersAndTeams.length > 0) {
            // Clean usersAndTeams to remove teams that are undefined/empty
            cleanedData.usersAndTeams = poolData.usersAndTeams.map(item => {
                const cleanedItem: any = { user: item.user };
                if (item.team && item.team.trim() !== '') {
                    cleanedItem.team = item.team;
                }
                return cleanedItem;
            });
        }

        console.log('Sending cleaned pool data:', cleanedData);
        const response = await apiClient.post('/pool', cleanedData);
        return response.data;
    } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
    }
}

// Functions migrated from dulus.server.ts

// Check pool deployment status (detailed response)
export async function checkPoolStatus(poolId: string): Promise<StatusCheckResponse> {
    try {
        const response = await apiClient.get('/range/status', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool status:', error);
        throw error;
    }
}

// Set topology for all users in pool
export async function setPoolTopology(poolId: string): Promise<void> {
    try {
        await apiClient.post('/range/config', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error setting pool topology:', error);
        throw error;
    }
}

// Fetch CTFd data for pool (only available if users, topology, and status are green)
export async function fetchCtfdData(poolId: string): Promise<void> {
    try {
        await apiClient.put('/ctfd/data', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error fetching CTFd data:', error);
        throw error;
    }
}

// Download CTFd logins (only available if ctfdData is true)
export async function downloadCtfdLogins(poolId: string): Promise<string> {
    try {
        const response = await apiClient.get('/ctfd/data/logins', {
            params: { poolId },
            headers: {
                'accept': 'text/plain'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading CTFd logins:', error);
        throw error;
    }
}

// Download Wireguard configurations as ZIP
export async function downloadWireguardConfigs(poolId: string): Promise<Blob> {
    try {
        const response = await apiClient.get('/range/access', {
            params: { poolId },
            headers: {
                'accept': 'application/zip'
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading Wireguard configs:', error);
        throw error;
    }
}

// Change pool topology
export async function changePoolTopology(poolId: string, topologyId: string): Promise<void> {
    try {
        await apiClient.patch('/pool/topology', { topologyId }, {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error changing pool topology:', error);
        throw error;
    }
}

// Deploy pool
export async function deployPool(poolId: string): Promise<any> {
    try {
        const response = await apiClient.post('/range/deploy', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error deploying pool:', error);
        throw error;
    }
}

// Redeploy pool
export async function redeployPool(poolId: string): Promise<any> {
    try {
        const response = await apiClient.post('/range/redeploy', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error redeploying pool:', error);
        throw error;
    }
}

// Abort pool operations
export async function abortPool(poolId: string): Promise<any> {
    try {
        const response = await apiClient.post('/range/abort', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error aborting pool operations:', error);
        throw error;
    }
}

// Remove/destroy pool
export async function removePool(poolId: string): Promise<any> {
    try {
        const response = await apiClient.post('/range/remove', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error removing pool:', error);
        throw error;
    }
}

// Pool detail and management functions

// Get pool details with users
export async function getPoolDetail(poolId: string): Promise<PoolDetail> {
    try {
        const response = await apiClient.get('/pool', {
            params: { 
                poolId,
                userIds: false 
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error loading pool detail:', error);
        throw error;
    }
}

// Check pool health (users, topology, status)
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

// Download user logs from Ludus API
export async function downloadUserLogs(poolId: string, userId: string): Promise<void> {
    try {
        // Call Ludus API for user logs
        const response = await ludusClient.get('/range/logs', {
            params: {
                userID: userId,
                tail: 100,
                resumeline: 0
            }
        });

        const logs = response.data;
        
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userId}_logs.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading user logs:', error);
        throw error;
    }
}

// Download user Wireguard config
export async function downloadUserWireguard(poolId: string, userId: string): Promise<void> {
    try {
        // Note: This function downloads configs for a single user, but the API only supports 
        // getting all configs for a pool. Consider using downloadWireguardConfigs instead.
        const response = await apiClient.get('/range/access', {
            params: { poolId },
            headers: {
                'Accept': 'application/zip'
            },
            responseType: 'blob'
        });

        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userId}_wireguard.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading user Wireguard config:', error);
        throw error;
    }
}

// Re-export consolidated functions for backward compatibility
export { checkUsersInPools, checkPoolUsers, importMissingUsers } from './users.client';
export { getTopologies, downloadTopologyFile, checkPoolTopology } from './topology.client';

// Patch pool users
export async function patchPoolUsers(poolId: string, usersAndTeams: PatchUserRequest[]): Promise<any> {
    try {
        const response = await apiClient.patch('/pool/users', 
            { usersAndTeams }, 
            { params: { poolId } }
        );
        return response.data;
    } catch (error) {
        console.error('Error patching pool users:', error);
        throw error;
    }
}

// Sharing functions for SHARED pool type

// Check sharing status
export async function checkSharingStatus(poolId: string, targetId: string): Promise<{ shared: boolean }> {
    try {
        const response = await apiClient.get('/range/shared', {
            params: { poolId, targetId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking sharing status:', error);
        throw error;
    }
}

// Share pool with target user
export async function sharePool(poolId: string, targetId: string): Promise<void> {
    try {
        await apiClient.post('/range/share', '', {
            params: { poolId, targetId }
        });
    } catch (error) {
        console.error('Error sharing pool:', error);
        throw error;
    }
}

// Unshare pool with target user
export async function unsharePool(poolId: string, targetId: string): Promise<void> {
    try {
        await apiClient.post('/range/unshare', '', {
            params: { poolId, targetId }
        });
    } catch (error) {
        console.error('Error unsharing pool:', error);
        throw error;
    }
}

// Individual pool data getters (from data_new.ts)
// WARNING: These endpoints are not defined in the API spec

// Get pool topology status individually - checks if users have range config via Ludus API
export async function getPoolTopology(poolId: string): Promise<boolean> {
    try {
        // This should check if pool users have topology configured
        // For now, we'll use the consolidated checkPoolTopology function
        const result = await checkPoolTopology(poolId);
        return result.matchPoolTopology || false;
    } catch (error) {
        console.error('Error loading pool topology:', error);
        throw error;
    }
}

// Get pool status individually (simplified response for UI) - uses Dulus range/status
export async function getPoolStatus(poolId: string): Promise<string> {
    try {
        // Use the existing checkPoolStatus function and extract status
        const result = await checkPoolStatus(poolId);
        return result.allDeployed ? 'DEPLOYED' : 'NOT_DEPLOYED';
    } catch (error) {
        console.error('Error loading pool status:', error);
        return 'Unknown';
    }
}

// Get pool flags individually - checks if CTFd data exists
export async function getPoolFlags(poolId: string): Promise<boolean> {
    try {
        // Check if CTFd data exists for this pool
        const response = await apiClient.get('/ctfd/data', {
            params: { poolId }
        });
        return Boolean(response.data?.ctfdData && response.data.ctfdData.length > 0);
    } catch (error) {
        // If 404 or other error, flags don't exist
        console.error('Error loading pool flags:', error);
        return false;
    }
}

// Refresh all pool data using correct API endpoints
export async function refreshPoolData(poolId: string): Promise<PoolDetailData> {
    try {
        const [topology, status, flags] = await Promise.allSettled([
            getPoolTopology(poolId),  // Now uses checkPoolTopology
            getPoolStatus(poolId),    // Now uses checkPoolStatus 
            getPoolFlags(poolId)      // Now uses ctfd/data endpoint
        ]);

        const topologyResult = topology.status === 'fulfilled' ? topology.value : null;
        const statusResult = status.status === 'fulfilled' ? status.value : null;
        const flagsResult = flags.status === 'fulfilled' ? flags.value : null;

        return {
            users: true,
            topology: topologyResult,
            status: statusResult,
            flags: flagsResult,
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

// Alternative name for getPoolDetail for compatibility
export const getPoolDetails = getPoolDetail;
