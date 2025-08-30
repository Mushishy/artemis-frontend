import axios from 'axios';
import https from 'https';
import { dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const apiClient = axios.create({
  baseURL: `${dulusBaseUrl}:${dulusPort}`,
  httpsAgent,
  headers: {
    'Accept': 'application/json',
    'X-API-Key': dulusApiKey,
  },
});

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
