import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPoolDetail } from '$lib/api/server/pools.server.js';

export const load: PageServerLoad = async ({ params }) => {
    const { poolId } = params;
    
    if (!poolId) {
        throw error(404, 'Pool not found');
    }
    
    // Load pool detail on server side to eliminate white blink
    try {
        const poolDetail = await getPoolDetail(poolId);
        return {
            poolId,
            poolDetail
        };
    } catch (err) {
        console.error('Server-side error loading pool detail:', err);
        // Return poolId anyway, let client handle the error
        return {
            poolId,
            poolDetail: null
        };
    }
};
