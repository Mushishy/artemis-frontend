import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPoolDetail } from '$lib/api/server/pools.server.js';
import { requireAuth } from '$lib/utils/auth-guard';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    const apiKey = await requireAuth(event);
    
    const { poolId } = event.params;
    
    if (!poolId) {
        throw error(404, 'Pool not found');
    }
    
    try {
        const poolDetail = await getPoolDetail(apiKey, poolId);
        return {
            poolId,
            poolDetail
        };
    } catch (err) {
        console.error('Error loading pool detail:', err);
        return {
            poolId,
            poolDetail: null
        };
    }
};
