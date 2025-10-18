import { getServerDulusClient } from '../settings/server-api-client';
import { formatDate } from '$lib/utils';
import type { Scenario } from '../types';

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