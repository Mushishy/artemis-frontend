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
 * Get scenario(s) - fetch a specific scenario by ID or list all scenarios
 * @param scenarioID - Optional scenario ID to fetch specific scenario
 * @returns Promise with scenario data
 */
export async function getScenario(scenarioID?: string) {
  try {
    const params = scenarioID ? { scenarioID } : {};
    const response = await apiClient.get('/ctfd/scenario', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching scenario:', error);
    throw error;
  }
}

/**
 * Create or update a scenario by uploading a .zip file
 * @param file - The .zip file to upload
 * @param scenarioID - Optional scenario ID for updating existing scenario
 * @returns Promise with upload result
 */
export async function createOrUpdateScenario(file: File, scenarioID?: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = scenarioID ? { scenarioID } : {};
    const response = await apiClient.put('/ctfd/scenario', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating/updating scenario:', error);
    throw error;
  }
}

/**
 * Delete a scenario by ID
 * @param scenarioID - The scenario ID to delete
 * @returns Promise with deletion result
 */
export async function deleteScenario(scenarioID: string) {
  try {
    const response = await apiClient.delete('/ctfd/scenario', {
      params: { scenarioID },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting scenario:', error);
    throw error;
  }
}
