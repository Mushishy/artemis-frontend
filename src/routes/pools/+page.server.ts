import { loadPools } from './data.js';
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
