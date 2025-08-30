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
