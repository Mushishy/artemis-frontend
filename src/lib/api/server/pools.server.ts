import { createServerDulusClient } from '../settings/server-api-client';
import { formatDate } from '$lib/utils/helper';
import type { Pool } from '../types';

export async function loadPools(apiKey: string): Promise<Pool[]> {
    try {
        const dulusClient = createServerDulusClient(apiKey);
        const response = await dulusClient.get('/pool');
        
        const pools = response.data;
        
        // Return empty array if no pools data
        if (!pools) {
            return [];
        }
        
        const poolsArray = Array.isArray(pools) ? pools : [pools];
        
        // Filter out null pools and ensure undefined values are converted to appropriate defaults
        return poolsArray
            .filter(pool => pool !== null && pool !== undefined)
            .map(pool => ({
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

export async function getPoolDetail(apiKey: string, poolId: string): Promise<any> {
    try {
        const dulusClient = createServerDulusClient(apiKey);
        const response = await dulusClient.get('/pool', { 
            params: { poolId, userIds: false }
        });
        return response.data;
    } catch (error: any) {
        console.error('getPoolDetail: Error getting pool details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
            params: error.config?.params
        });
        throw error;
    }
}
