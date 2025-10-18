import { getServerDulusClient } from '../settings/server-api-client';
import { formatDate } from '$lib/utils';
import type { Pool } from '../types';

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
