import { getTopologiesDisplay } from '$lib/api/server/topology.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const apiKey = await requireAuth(event);
    
    try {
        const topologies = await getTopologiesDisplay(apiKey);
        return {
            topologies
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            topologies: []
        };
    }
};