import { getTopology } from '$lib/api/topology.server';
import type { PageServerLoad } from './$types';

export interface Topology {
    ID: string;
    Name: string;
    Created: string;
}

// Load topologies from API (server-side)
async function loadTopologies(): Promise<Topology[]> {
    try {
        const response = await getTopology();
        
        // Handle both single topology and array of topologies
        if (Array.isArray(response)) {
            return response.map(item => ({
                ID: item.topologyId,
                Name: item.topologyName,
                Created: item.createdAt
            }));
        } else if (response.topologyId) {
            return [{
                ID: response.topologyId,
                Name: response.topologyName,
                Created: response.createdAt
            }];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading topologies:', error);
        return [];
    }
}

export const load: PageServerLoad = async () => {
    const topologies = await loadTopologies();
    return {
        topologies
    };
};
