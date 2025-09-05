import { loadPools } from '$lib/api/pools';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const pools = await loadPools();
        return {
            pools
        };
    } catch (error) {
        console.error('Error loading pools:', error);
        return {
            pools: []
        };
    }
};
