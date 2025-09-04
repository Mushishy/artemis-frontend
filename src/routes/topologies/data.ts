import { getTopology, createOrUpdateTopology, deleteTopology, downloadTopologyFile } from "$lib/api/topology.client";
import { formatDate } from '$lib/utils';

export interface Topology {
    ID: string;
    Name: string;
    Created: string;
}

// Load topologies from API
export async function loadTopologies(): Promise<Topology[]> {
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
        console.error('Error loading topologies:', error);
        return [];
    }
}

// Create or update topology
export async function uploadTopology(file: File, topologyId?: string) {
    try {
        return await createOrUpdateTopology(file, topologyId);
    } catch (error) {
        console.error('Error uploading topology:', error);
        throw error;
    }
}

// Download topology (use consolidated function from topology.client)
export async function downloadTopology(topologyId: string): Promise<void> {
    try {
        await downloadTopologyFile(topologyId);
    } catch (error) {
        console.error('Error downloading topology:', error);
        throw error;
    }
}

// Delete topology
export async function removeTopology(topologyId: string) {
    try {
        return await deleteTopology(topologyId);
    } catch (error) {
        console.error('Error deleting topology:', error);
        throw error;
    }
}
