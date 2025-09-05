import { getDulusClient } from './api-client';
import { formatDate } from '$lib/utils';
import type { Scenario } from './types';

const dulusClient = getDulusClient();

export async function getScenario(scenarioID?: string) {
    try {
        const params = scenarioID ? { scenarioID } : {};
        const response = await dulusClient.get('/ctfd/scenario', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching scenario:', error);
        throw error;
    }
}

// Get formatted scenarios for display
export async function getScenariosDisplay(): Promise<Scenario[]> {
    try {
        const response = await getScenario();
        
        // Handle both single scenario and array of scenarios
        if (Array.isArray(response)) {
            return response.map(item => ({
                ID: item.scenarioID,
                Name: item.scenarioName,
                Created: formatDate(item.createdAt)
            }));
        } else if (response.scenarioID) {
            return [{
                ID: response.scenarioID,
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

// Download scenario file
export async function downloadScenarioFile(scenarioID: string): Promise<void> {
    try {
        const response = await getScenario(scenarioID);
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

export async function createOrUpdateScenario(file: File, scenarioID?: string) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const params = scenarioID ? { scenarioID } : {};
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

export async function deleteScenario(scenarioID: string) {
    try {
        const response = await dulusClient.delete('/ctfd/scenario', {
            params: { scenarioId: scenarioID },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting scenario:', error);
        throw error;
    }
}