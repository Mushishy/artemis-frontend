import { getScenario } from '$lib/api/ctfd_scenario.server';
import type { PageServerLoad } from './$types';

export interface Scenario {
    ID: string;
    Name: string;
    Created: string;
}

// Load scenarios from API (server-side)
async function loadScenarios(): Promise<Scenario[]> {
    try {
        const response = await getScenario();
        
        // Handle both single scenario and array of scenarios
        if (Array.isArray(response)) {
            return response.map(item => ({
                ID: item.scenarioID,
                Name: item.scenarioName,
                Created: item.createdAt
            }));
        } else if (response.scenarioID) {
            return [{
                ID: response.scenarioID,
                Name: response.scenarioName,
                Created: response.createdAt
            }];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading scenarios:', error);
        return [];
    }
}

export const load: PageServerLoad = async () => {
    const scenarios = await loadScenarios();
    return {
        scenarios
    };
};