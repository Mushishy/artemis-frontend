import axios from 'axios';
import https from 'https';
import { dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

// Create HTTPS agent that allows self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Disable SSL verification for self-signed certificates
});

// Configure axios instance
const apiClient = axios.create({
  baseURL: `${dulusBaseUrl}:${dulusPort}`,
  httpsAgent,
  headers: {
    'Accept': 'application/json',
    'X-API-Key': dulusApiKey,
  },
});

// Types for CTFd data
interface Flag {
  variable: string;
  contents: string;
}

interface CtfdDataItem {
  user: string;
  password: string;
  team?: string;
  flags: Flag[];
}

interface CtfdDataPayload {
  ctfd_data: CtfdDataItem[];
}

/**
 * Get CTFd data - fetch specific data by ID or list all data
 * @param ctfdDataId - Optional data ID to fetch specific data
 * @returns Promise with CTFd data
 */
export async function getCtfdData(ctfdDataId?: string) {
  try {
    const params = ctfdDataId ? { ctfdDataId } : {};
    const response = await apiClient.get('/ctfd/data', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching CTFd data:', error);
    throw error;
  }
}

/**
 * Create or update CTFd data
 * @param ctfdData - Array of CTFd data items
 * @param ctfdDataId - Optional data ID for updating existing data
 * @returns Promise with upload result
 */
export async function createOrUpdateCtfdData(ctfdData: CtfdDataItem[], ctfdDataId?: string) {
  try {
    const payload: CtfdDataPayload = { ctfd_data: ctfdData };
    const params = ctfdDataId ? { ctfdDataId } : {};
    
    const response = await apiClient.put('/ctfd/data', payload, { params });
    return response.data;
  } catch (error) {
    console.error('Error creating/updating CTFd data:', error);
    throw error;
  }
}

/**
 * Delete CTFd data by ID
 * @param ctfdDataId - The data ID to delete
 * @returns Promise with deletion result
 */
export async function deleteCtfdData(ctfdDataId: string) {
  try {
    const response = await apiClient.delete('/ctfd/data', {
      params: { ctfdDataId },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting CTFd data:', error);
    throw error;
  }
}
