import { getDulusClient } from './api-client';
import type { Topology, TopologyCheckResponse } from './types';

// Configure axios instance for both client and server
const apiClient = getDulusClient();

/**
 * Get topology data - fetch specific topology by ID or list all topologies
 * @param topologyId - Optional topology ID to fetch specific topology
 * @returns Promise with topology data
 */
export async function getTopology(topologyId?: string) {
  try {
    const params = topologyId ? { topologyId } : {};
    const response = await apiClient.get('/topology', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching topology:', error);
    throw error;
  }
}

/**
 * Get all available topologies (consolidating getTopologies from pools.client)
 * @returns Promise with list of all topologies
 */
export async function getTopologies(): Promise<Topology[]> {
  try {
    const response = await apiClient.get('/topology');
    return response.data;
  } catch (error) {
    console.error('Error fetching topologies:', error);
    throw error;
  }
}

/**
 * Download topology file content and metadata
 * @param topologyId - The topology ID to download
 * @returns Promise with topology content and metadata
 */
export async function downloadTopology(topologyId: string): Promise<{
  content: string;
  filename: string;
  createdAt: string;
}> {
  try {
    const response = await apiClient.get(`/topology?topologyId=${topologyId}`);
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
 * Download topology file to user's computer (consolidating downloadTopologyFile from pools.client)
 * @param topologyId - The topology ID to download
 */
export async function downloadTopologyFile(topologyId: string): Promise<void> {
  try {
    const { content, filename } = await downloadTopology(topologyId);

    // Create a blob and download the file
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading topology file:', error);
    throw error;
  }
}

/**
 * Check if pool topology matches (moved from pools.client)
 * @param poolId - The pool ID to check topology for
 * @returns Promise with topology check response
 */
export async function checkPoolTopology(poolId: string): Promise<TopologyCheckResponse> {
  try {
    const response = await apiClient.get('/range/config', {
      params: { poolId }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking pool topology:', error);
    throw error;
  }
}

/**
 * Create or update a topology by uploading a file
 * @param file - The file to upload
 * @param topologyId - Optional topology ID for updating existing topology
 * @returns Promise with upload result
 */
export async function createOrUpdateTopology(file: File, topologyId?: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = topologyId ? { topologyId } : {};
    const response = await apiClient.put('/topology', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating/updating topology:', error);
    throw error;
  }
}

/**
 * Delete a topology by ID
 * @param topologyId - The topology ID to delete
 * @returns Promise with deletion result
 */
export async function deleteTopology(topologyId: string) {
  try {
    const response = await apiClient.delete('/topology', {
      params: { topologyId },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting topology:', error);
    throw error;
  }
}
