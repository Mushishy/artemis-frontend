import axios from 'axios';
import { dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

// Browser-compatible axios instance (no https agent)
const apiClient = axios.create({
  baseURL: `${dulusBaseUrl}:${dulusPort}`,
  headers: {
    'Accept': 'application/json',
    'X-API-Key': dulusApiKey,
  },
});

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
