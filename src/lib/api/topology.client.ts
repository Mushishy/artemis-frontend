/**
 * Topology management API client
 * Handles topology CRUD operations and pool topology checking
 */

import { getDulusClient } from './api-client';
import type { Topology, TopologyCheckResponse } from './types';

const dulusClient = getDulusClient();

// ============================================================================
// TOPOLOGY DATA RETRIEVAL
// ============================================================================

/**
 * Get specific topology by ID or list all topologies
 */
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

/**
 * Get all available topologies
 */
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

/**
 * Download topology file content and metadata
 */
export async function downloadTopology(topologyId: string): Promise<{
    content: string;
    filename: string;
    createdAt: string;
}> {
    try {
        const response = await dulusClient.get(`/topology?topologyId=${topologyId}`);
        const { topologyFile, topologyName, createdAt } = response.data;
        
        // Base64 decode the topology file
        const decodedContent = atob(topologyFile);
        
        return {
            content: decodedContent,
            filename: topologyName,
            createdAt
        };
    } catch (error) {
        console.error('Error downloading topology:', error);
        throw error;
    }
}

/**
 * Download topology file to user's computer
 */
export async function downloadTopologyFile(topologyId: string): Promise<void> {
    try {
        const { content, filename } = await downloadTopology(topologyId);

        const blob = new Blob([content], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
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

/**
 * Create or update a topology by uploading a file
 */
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

/**
 * Delete a topology by ID
 */
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

/**
 * Check if pool topology configuration matches
 */
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
