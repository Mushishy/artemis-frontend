import { getDulusClient } from './api-client';
import type { Topology, TopologyCheckResponse } from './types';

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
        
        const params = topologyId ? { topologyId } : {};
        const response = await dulusClient.put('/topology', formData, {
            params,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
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
