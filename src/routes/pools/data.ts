import { dulusBaseUrl, dulusPort, dulusApiKey } from "$lib/api/settings";

export interface Pool {
    poolId: string;
    note?: string;
    createdBy: string;
    type: 'INDIVIDUAL' | 'SHARED' | 'CTFD';
    topologyId: string;
    ctfdData: boolean;
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
            ctfdData: Boolean(pool.ctfdData)
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
