/**
 * Server-side topology API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerDulusClient } from './server-api-client';
import { formatDate } from '$lib/utils';
import type { Topology, TopologyCheckResponse, TopologyDisplay } from './types';

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

export async function getTopologies(): Promise<Topology[]> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/topology');
        return response.data;
    } catch (error) {
        console.error('Error fetching topologies:', error);
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

// ============================================================================
// TOPOLOGY MANAGEMENT
// ============================================================================

export async function createOrUpdateTopology(file: File, topologyId?: string) {
    try {
        const dulusClient = getServerDulusClient();
        const formData = new FormData();
        formData.append('file', file);
        
        const params = topologyId ? { topologyId } : {};
        const response = await dulusClient.put('/topology', formData, {
            params,
            headers: { 
                // Don't set Content-Type - let axios/browser set it with boundary
                'Content-Type': undefined 
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating/updating topology:', error);
        throw error;
    }
}

export async function deleteTopology(topologyId: string) {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.delete('/topology', {
            params: { topologyId },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting topology:', error);
        throw error;
    }
}

// ============================================================================
// POOL TOPOLOGY CHECKING
// ============================================================================

export async function checkPoolTopology(poolId: string): Promise<TopologyCheckResponse> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/range/config', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool topology:', error);
        throw error;
    }
}
