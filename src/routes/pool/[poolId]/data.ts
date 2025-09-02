import { dulusBaseUrl, dulusPort, dulusApiKey } from "$lib/api/settings";

export interface PoolUser {
    team: string;
    user: string;
    userId: string;
    status?: string;
}

export interface PoolDetail {
    createdBy: string;
    ctfdData: boolean;
    mainUser: string;
    note: string;
    poolId: string;
    topologyId: string;
    type: string;
    usersAndTeams: PoolUser[];
}

export interface PoolDetailData {
    users: boolean | null;
    topology: boolean | null;
    status: string | null;
    flags: boolean | null;
    isLoading: boolean;
}

export interface PoolHealthCheck {
    users: {
        allExist: boolean;
        missingUserIds: string[];
    } | null;
    topology: {
        matchPoolTopology: boolean;
    } | null;
    status: {
        allDeployed: boolean;
        results: Array<{
            state: string;
            userId: string;
        }>;
    } | null;
    isLoading: boolean;
}

// Get pool details with users
export async function getPoolDetail(poolId: string): Promise<PoolDetail> {
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

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading pool detail:', error);
        throw error;
    }
}

// Refresh all pool data
export async function refreshPoolData(poolId: string): Promise<PoolDetailData> {
    try {
        const [topology, status, flags] = await Promise.allSettled([
            fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/topology`, {
                headers: { 'Accept': 'application/json', 'X-API-Key': dulusApiKey }
            }),
            fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/status`, {
                headers: { 'Accept': 'application/json', 'X-API-Key': dulusApiKey }
            }),
            fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/flags`, {
                headers: { 'Accept': 'application/json', 'X-API-Key': dulusApiKey }
            })
        ]);

        const topologyResult = topology.status === 'fulfilled' && topology.value.ok ? 
            Boolean((await topology.value.json()).topology) : null;
        const statusResult = status.status === 'fulfilled' && status.value.ok ? 
            (await status.value.json()).status : null;
        const flagsResult = flags.status === 'fulfilled' && flags.value.ok ? 
            Boolean((await flags.value.json()).flags) : null;

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

// Download user logs
export async function downloadUserLogs(poolId: string, userId: string): Promise<void> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/user/${userId}/logs`, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const logs = await response.text();
        
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
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/range/access`, {
            method: 'POST',
            headers: {
                'Accept': 'application/zip',
                'X-API-Key': dulusApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIds: [userId]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
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

// Check pool health (users, topology, status)
export async function checkPoolHealth(poolId: string): Promise<PoolHealthCheck> {
    try {
        const response = await fetch(`/api/pool/health?poolId=${encodeURIComponent(poolId)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            users: data.users.error ? null : data.users,
            topology: data.topology.error ? null : data.topology,
            status: data.status.error ? null : data.status,
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

// Import missing users
export async function importMissingUsers(poolId: string): Promise<any> {
    try {
        const response = await fetch(`/api/pool/import-users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error importing missing users:', error);
        throw error;
    }
}

// Set pool topology
export async function setPoolTopology(poolId: string): Promise<any> {
    try {
        const response = await fetch(`/api/pool/set-topology`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error setting pool topology:', error);
        throw error;
    }
}

// Get available topologies
export async function getTopologies(): Promise<any[]> {
    try {
        const response = await fetch(`/api/topologies`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting topologies:', error);
        throw error;
    }
}

// Change pool topology
export async function changePoolTopology(poolId: string, topologyId: string): Promise<void> {
    try {
        const response = await fetch(`/api/pool/change-topology`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId, topologyId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error changing pool topology:', error);
        throw error;
    }
}

// Fetch CTFd data for pool
export async function fetchCtfdData(poolId: string): Promise<void> {
    try {
        const response = await fetch(`/api/pool/fetch-ctfd`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching CTFd data:', error);
        throw error;
    }
}

// Download CTFd logins
export async function downloadCtfdLogins(poolId: string): Promise<void> {
    try {
        const response = await fetch(`/api/pool/download-ctfd-logins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to download CTFd logins');
        }

        // Create and download the file
        const blob = new Blob([result.data], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ctfd_logins_${poolId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading CTFd logins:', error);
        throw error;
    }
}

// Download Wireguard configurations
export async function downloadWireguardConfigs(poolId: string): Promise<void> {
    try {
        const response = await fetch(`/api/pool/download-wireguard`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wireguard_configs_${poolId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading Wireguard configs:', error);
        throw error;
    }
}

// Deploy pool
export async function deployPool(poolId: string): Promise<any> {
    try {
        const response = await fetch(`/api/pool/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deploying pool:', error);
        throw error;
    }
}

// Redeploy pool
export async function redeployPool(poolId: string): Promise<any> {
    try {
        const response = await fetch(`/api/pool/redeploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error redeploying pool:', error);
        throw error;
    }
}

// Abort pool operations
export async function abortPool(poolId: string): Promise<any> {
    try {
        const response = await fetch(`/api/pool/abort`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error aborting pool operations:', error);
        throw error;
    }
}

// Remove/destroy pool
export async function destroyPool(poolId: string): Promise<any> {
    try {
        const response = await fetch(`/api/pool/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ poolId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error removing pool:', error);
        throw error;
    }
}

// Fetch user logs
export async function fetchUserLogs(userId: string, tail: number = 100, resumeline: number = 0): Promise<{ result: string; cursor: number }> {
    try {
        const response = await fetch(`/api/logs/${userId}?tail=${tail}&resumeline=${resumeline}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching user logs:', error);
        throw error;
    }
}

// Interface for user existence check
export interface UserExistsCheck {
    exists: boolean;
    userId: string;
}

// Check if users exist in pools
export async function checkUsersInPools(userIds: string[]): Promise<UserExistsCheck[]> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey,
            },
            body: JSON.stringify({ userIds: userIds }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error checking users in pools:', error);
        throw error;
    }
}

// Patch pool users
export async function patchPoolUsers(poolId: string, usersAndTeams: Array<{user: string; team?: string}>): Promise<any> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/users?poolId=${poolId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey,
            },
            body: JSON.stringify({ usersAndTeams }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error patching pool users:', error);
        throw error;
    }
}
