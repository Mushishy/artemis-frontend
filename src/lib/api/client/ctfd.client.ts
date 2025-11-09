import { getDulusClient } from '../settings/api-client';
import { formatDate } from '$lib/utils/helper';
import type { Scenario } from '../types';

const dulusClient = getDulusClient();

export async function getScenario(scenarioId?: string) {
    try {
        const params = scenarioId ? { scenarioId: scenarioId  } : {};
        const response = await dulusClient.get('/ctfd/scenario', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching scenario:', error);
        throw error;
    }
}

export async function getScenariosDisplay(): Promise<Scenario[]> {
    try {
        const response = await getScenario();
        
        // Handle both single scenario and array of scenarios
        if (Array.isArray(response)) {
            return response.map(item => ({
                ID: item.scenarioId,
                Name: item.scenarioName,
                Created: formatDate(item.createdAt)
            }));
        } else if (response.scenarioId) {
            return [{
                ID: response.scenarioId,
                Name: response.scenarioName,
                Created: formatDate(response.createdAt)
            }];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading formatted scenarios:', error);
        return [];
    }
}

export async function downloadScenarioFile(scenarioId: string): Promise<void> {
    try {
        const response = await getScenario(scenarioId);
        
        if (!response || !response.scenarioFile) {
            throw new Error('Scenario file not found');
        }
        
        if (response.scenarioFile && response.scenarioName) {
            // Decode base64 file content
            const binaryString = atob(response.scenarioFile);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Create blob and download
            const blob = new Blob([bytes], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.scenarioName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error downloading scenario:', error);
        throw error;
    }
}

export async function createOrUpdateScenario(file: File, scenarioId?: string) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const params = scenarioId ? { scenarioId: scenarioId } : {};
        const response = await dulusClient.put('/ctfd/scenario', formData, {
            params,
            headers: { 
                // Don't set Content-Type - let axios/browser set it with boundary
                'Content-Type': undefined 
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating/updating scenario:', error);
        throw error;
    }
}

export async function deleteScenario(scenarioId: string) {
    try {
        const response = await dulusClient.delete('/ctfd/scenario', {
            params: { scenarioId: scenarioId },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting scenario:', error);
        throw error;
    }
}

export async function downloadCtfdLogins(poolId: string): Promise<string> {
    try {
        const response = await dulusClient.get('/ctfd/data/logins', {
            params: { poolId },
            headers: { 'accept': 'text/plain' }
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading CTFd logins:', error);
        throw error;
    }
}

export async function fetchCtfdData(poolId: string): Promise<void> {
    try {
        await dulusClient.put('/ctfd/data', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error fetching CTFd data:', error);
        throw error;
    }
}

export async function getPoolFlags(poolId: string): Promise<boolean> {
    try {
        const response = await dulusClient.get('/ctfd/data', {
            params: { poolId }
        });
        return Boolean(response.data?.ctfdData && response.data.ctfdData.length > 0);
    } catch (error) {
        console.error('Error loading pool flags:', error);
        return false;
    }
}

export async function downloadCtfdFlags(poolId: string): Promise<void> {
    try {
        const response = await dulusClient.get('/ctfd/data', {
            params: { poolId }
        });
        
        if (!response.data?.ctfdData) {
            throw new Error('CTFd flags data not found');
        }
        
        // Create JSON blob and download
        const jsonString = JSON.stringify(response.data.ctfdData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${poolId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading CTFd flags:', error);
        throw error;
    }
}