/**
 * Server-side topology API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerDulusClient } from './server-api-client';
import { formatDate } from '$lib/utils';
import type { TopologyDisplay } from './types';

// ============================================================================
// TOPOLOGY DATA RETRIEVAL
// ============================================================================

export async function getTopology(topologyId?: string) {
    try {
        const dulusClient = getServerDulusClient();
        const params = topologyId ? { topologyId } : {};
        const response = await dulusClient.get('/topology', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching topology:', error);
        throw error;
    }
}

// Get formatted topologies for display
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