import { getTopologiesDisplay } from '$lib/api/server/topology.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    requireAuth(event);
    
    try {
        const topologies = await getTopologiesDisplay();
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