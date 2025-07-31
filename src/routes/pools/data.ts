import { dulusBaseUrl, dulusPort, dulusApiKey } from "$lib/api/settings";

export interface Pool {
    poolId: string;
    note?: string;
    createdBy: string;
    type: 'INDIVIDUAL' | 'SHARED' | 'CTFD';
    topologyId: string;
    ctfdDataId?: string;
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
        
        // Ensure undefined values are converted to empty strings
        return poolsArray.map(pool => ({
            ...pool,
            note: pool.note || "",
            ctfdDataId: pool.ctfdDataId || ""
        }));
    } catch (error) {
        console.error('Error loading pools:', error);
        throw error;
    }
}

// Download CTFD data as JSON file
export async function downloadCtfdData(poolId: string): Promise<void> {
    try {
        // First get the pool to get the ctfdDataId
        const poolResponse = await fetch(`${dulusBaseUrl}:${dulusPort}/pool?poolId=${poolId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!poolResponse.ok) {
            throw new Error(`Failed to get pool data: ${poolResponse.status}`);
        }

        const pool = await poolResponse.json();
        const ctfdDataId = pool.ctfdDataId;

        if (!ctfdDataId) {
            throw new Error('No CTFD data ID found for this pool');
        }

        // Download the CTFD data
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/ctfd/data?ctfdDataId=${ctfdDataId}`, {
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
        
        // Create and download the file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ctfd_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading CTFD data:', error);
        throw error;
    }
}

// Download logins as CSV file
export async function downloadLogins(poolId: string): Promise<void> {
    try {
        // First get the pool to get the ctfdDataId
        const poolResponse = await fetch(`${dulusBaseUrl}:${dulusPort}/pool?poolId=${poolId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!poolResponse.ok) {
            throw new Error(`Failed to get pool data: ${poolResponse.status}`);
        }

        const pool = await poolResponse.json();
        const ctfdDataId = pool.ctfdDataId;

        if (!ctfdDataId) {
            throw new Error('No CTFD data ID found for this pool');
        }

        // Download the logins CSV
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/ctfd/data/logins?ctfdDataId=${ctfdDataId}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain',
                'X-API-Key': dulusApiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvData = await response.text();
        
        // Create and download the file
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'logins.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading logins:', error);
        throw error;
    }
}

// Download Wireguard configs as ZIP file
export async function downloadWireguardConfigs(poolId: string): Promise<void> {
    try {
        // First get the pool users
        const poolResponse = await fetch(`${dulusBaseUrl}:${dulusPort}/pool?poolId=${poolId}&users=true`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': dulusApiKey
            }
        });

        if (!poolResponse.ok) {
            throw new Error(`Failed to get pool users: ${poolResponse.status}`);
        }

        const poolData = await poolResponse.json();
        
        if (!poolData.usersAndTeams || !Array.isArray(poolData.usersAndTeams)) {
            throw new Error('No users found for this pool');
        }

        // Add BATCH prefix to usernames
        const userIds = poolData.usersAndTeams.map((userTeam: any) => `BATCH${userTeam.user}`);

        if (userIds.length === 0) {
            throw new Error('No users found to generate Wireguard configs for');
        }

        // Request Wireguard configs
        const response = await fetch(`${dulusBaseUrl}:${dulusPort}/range/access`, {
            method: 'POST',
            headers: {
                'Accept': 'application/zip',
                'X-API-Key': dulusApiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userIds: userIds
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
        a.download = 'wireguard_configs.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading Wireguard configs:', error);
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
