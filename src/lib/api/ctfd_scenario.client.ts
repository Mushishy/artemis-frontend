import axios from 'axios';
import { dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

const apiClient = axios.create({
  baseURL: `${dulusBaseUrl}:${dulusPort}`,
  headers: {
    'Accept': 'application/json',
    'X-API-Key': dulusApiKey,
  },
});

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

export async function deleteScenario(scenarioID: string) {
  try {
    const response = await apiClient.delete('/ctfd/scenario', {
      params: { scenarioId: scenarioID },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting scenario:', error);
    throw error;
  }
}