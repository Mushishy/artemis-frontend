import { getTopologiesDisplay } from '$lib/api/topology.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const topologies = await getTopologiesDisplay();
    return {
        topologies
    };
};
