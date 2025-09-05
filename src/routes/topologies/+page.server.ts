import { getTopologiesDisplay } from '$lib/api/topology.client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const topologies = await getTopologiesDisplay();
    return {
        topologies
    };
};
