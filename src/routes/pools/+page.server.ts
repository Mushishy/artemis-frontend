import { loadPools } from '$lib/api/server/pools.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    requireAuth(event);
    
    try {
        const pools = await loadPools();
        return {
            pools
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            pools: []
        };
    }
};
