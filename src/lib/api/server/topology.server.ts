import { createServerDulusClient } from '../settings/server-api-client';
import { serverApiKey } from '../settings/settings-server';
import { formatDate } from '$lib/utils';
import type { TopologyDisplay } from '../types';

export async function getTopology(topologyId?: string) {
    try {
        const dulusClient = createServerDulusClient(serverApiKey || '');
        const params = topologyId ? { topologyId } : {};
        const response = await dulusClient.get('/topology', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching topology:', error);
        throw error;
    }
}

export async function getTopologiesDisplay(): Promise<TopologyDisplay[]> {
    try {
        const response = await getTopology();
        
        // Handle both single topology and array of topologies
        if (Array.isArray(response)) {
            return response.map(item => ({
                ID: item.topologyId,
                Name: item.topologyName,
                Created: formatDate(item.createdAt)
            }));
        } else if (response.topologyId) {
            return [{
                ID: response.topologyId,
                Name: response.topologyName,
                Created: formatDate(response.createdAt)
            }];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading formatted topologies:', error);
        return [];
    }
}