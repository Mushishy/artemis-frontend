import { getScenario, createOrUpdateScenario, deleteScenario } from "$lib/api/ctfd_scenario.client";

export interface Scenario {
    ID: string;
    Name: string;
    Created: string;
}

// Load scenarios from API
export async function loadScenarios(): Promise<Scenario[]> {
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

// Create or update scenario
export async function uploadScenario(file: File, scenarioID?: string) {
    try {
        return await createOrUpdateScenario(file, scenarioID);
    } catch (error) {
        console.error('Error uploading scenario:', error);
        throw error;
    }
}

// Download scenario
export async function downloadScenario(scenarioID: string): Promise<void> {
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

// Delete scenario
export async function removeScenario(scenarioID: string) {
    try {
        return await deleteScenario(scenarioID);
    } catch (error) {
        console.error('Error deleting scenario:', error);
        throw error;
    }
}