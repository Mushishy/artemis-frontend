import { loadPools } from '$lib/api/server/pools.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const apiKey = await requireAuth(event);
    
    try {
        const pools = await loadPools(apiKey);
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
