import { dulusBaseUrl, dulusPort, dulusApiKey } from "$lib/api/settings";

export interface PoolUserTeam {
    team: string;
    user: string;
    userId: string;
}

export interface PoolDetail {
    createdBy: string;
    ctfdData: boolean;
    mainUser: string;
    note: string;
    poolId: string;
    topologyId: string;
    type: 'INDIVIDUAL' | 'SHARED' | 'CTFD';
    usersAndTeams: PoolUserTeam[];
}

export interface PoolDetailData {
    users: boolean | null;
    topology: boolean | null;
    status: string | null;
    flags: boolean | null;
    isLoading: boolean;
}

// Get pool details including users
export async function getPoolDetails(poolId: string): Promise<PoolDetail> {
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
        console.error('Error loading pool details:', error);
        throw error;
    }
}

// Get pool topology status
export async function getPoolTopology(poolId: string): Promise<boolean> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/topology`, {
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
        return Boolean(data.topology);
    } catch (error) {
        console.error('Error loading pool topology:', error);
        throw error;
    }
}

// Get pool status
export async function getPoolStatus(poolId: string): Promise<string> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/status`, {
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
        return data.status || 'Unknown';
    } catch (error) {
        console.error('Error loading pool status:', error);
        throw error;
    }
}

// Get pool flags
export async function getPoolFlags(poolId: string): Promise<boolean> {
    try {
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/pool/${poolId}/flags`, {
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
        return Boolean(data.flags);
    } catch (error) {
        console.error('Error loading pool flags:', error);
        throw error;
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
        
        // Create and download the file
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
                userIds: [userId] // Use userId directly as it already includes BATCH prefix
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        
        // Create and download the file
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
