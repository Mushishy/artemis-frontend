import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const { poolId } = params;
    
    if (!poolId) {
        throw error(404, 'Pool not found');
    }
    
    return {
        poolId
    };
};
