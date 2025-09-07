/**
 * Server-side CTF scenarios API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerDulusClient } from './server-api-client';
import { formatDate } from '$lib/utils';
import type { Scenario } from './types';

export async function getScenario(scenarioID?: string) {
    try {
        const dulusClient = getServerDulusClient();
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

export async function createOrUpdateScenario(file: File, scenarioID?: string) {
    try {
        const dulusClient = getServerDulusClient();
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
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.delete('/ctfd/scenario', {
            params: { scenarioId: scenarioID },
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting scenario:', error);
        throw error;
    }
}
