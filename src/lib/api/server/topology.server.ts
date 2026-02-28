import { createServerDulusClient } from '../settings/server-api-client';
import { formatDate } from '$lib/utils/helper';
import type { TopologyDisplay } from '../types';

export async function getTopology(apiKey: string, topologyId?: string) {
    try {
        const dulusClient = createServerDulusClient(apiKey);
        const params = topologyId ? { topologyId } : {};
        const response = await dulusClient.get('/topology', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching topology:', error);
        throw error;
    }
}

export async function getTopologiesDisplay(apiKey: string): Promise<TopologyDisplay[]> {
    try {
        const response = await getTopology(apiKey);
        
        // Return empty array if no response
        if (!response) {
            return [];
        }
        
        // Handle both single topology and array of topologies
        if (Array.isArray(response)) {
            return response
                .filter(item => item && item.topologyId) // Filter out null items
                .map(item => ({
                    ID: item.topologyId,
                    Name: item.topologyName || 'Unnamed Topology',
                    Created: formatDate(item.createdAt)
                }));
        } else if (response.topologyId) {
            return [{
                ID: response.topologyId,
                Name: response.topologyName || 'Unnamed Topology',
                Created: formatDate(response.createdAt)
            }];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading formatted topologies:', error);
        return [];
    }
}