import { getDulusClient } from './api-client';
import { formatDate } from '$lib/utils';
import type { Topology, TopologyCheckResponse, TopologyDisplay } from './types';

const dulusClient = getDulusClient();

// ============================================================================
// TOPOLOGY DATA RETRIEVAL
// ============================================================================

export async function getTopology(topologyId?: string) {
    try {
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
// TOPOLOGY FILE OPERATIONS
// ============================================================================

export async function downloadTopologyFile(topologyId: string): Promise<void> {
    try {
        const response = await dulusClient.get(`/topology?topologyId=${topologyId}`);
        const { topologyFile, topologyName } = response.data;
        const decodedContent = atob(topologyFile);
        const blob = new Blob([decodedContent], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = topologyName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading topology file:', error);
        throw error;
    }
}

// ============================================================================
// TOPOLOGY MANAGEMENT
// ============================================================================

export async function createOrUpdateTopology(file: File, topologyId?: string) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const params = topologyId ? { topologyId: topologyId} : {};
        const response = await dulusClient.put('/topology', formData, {
            params,
            headers: { 
                // Don't set Content-Type - let axios/browser set it with boundary
                'Content-Type': undefined 
            },
        });
        console.log('Response from createOrUpdateTopology:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating/updating topology:', error);
        throw error;
    }
}

export async function deleteTopology(topologyId: string) {
    try {
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
        const response = await dulusClient.get('/range/config', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool topology:', error);
        throw error;
    }
}
