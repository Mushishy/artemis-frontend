import axios from 'axios';
import { dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

const apiClient = axios.create({
    baseURL: `${dulusBaseUrl}:${dulusPort}`,
    headers: {
        'Accept': 'application/json',
        'X-API-Key': dulusApiKey,
    },
});

export interface PoolUserAndTeam {
    user: string;
    team?: string;
}

export interface PoolRequest {
    type: 'CTFD' | 'SHARED' | 'INDIVIDUAL';
    mainUser?: string;
    usersAndTeams?: PoolUserAndTeam[];
    topologyId: string;
    note?: string;
}

export async function createPool(poolData: PoolRequest) {
    try {
        // Clean the pool data to remove undefined/empty values
        const cleanedData: any = {
            type: poolData.type,
            topologyId: poolData.topologyId
        };

        // Only add optional fields if they have actual values
        if ((poolData.type == 'CTFD' || poolData.type == 'SHARED') && poolData.mainUser) {
            cleanedData.mainUser = poolData.mainUser;
        }

        if (poolData.usersAndTeams && poolData.usersAndTeams.length > 0) {
            // Clean usersAndTeams to remove teams that are undefined/empty
            cleanedData.usersAndTeams = poolData.usersAndTeams.map(item => {
                const cleanedItem: any = { user: item.user };
                if (item.team && item.team.trim() !== '') {
                    cleanedItem.team = item.team;
                }
                return cleanedItem;
            });
        }

        if (poolData.note && poolData.note.trim() !== '') {
            cleanedData.note = poolData.note;
        }

        console.log('Sending cleaned pool data:', cleanedData);
        const response = await apiClient.post('/pool', cleanedData);
        return response.data;
    } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
    }
}

// Function to download topology file
export async function downloadTopologyFile(topologyId: string): Promise<void> {
    try {
        const response = await fetch('/api/topology/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topologyId })
        });

        if (!response.ok) {
            throw new Error('Failed to download topology');
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to download topology');
        }

        const { content, filename } = result.data;

        // Create a blob and download the file
        const blob = new Blob([content], { type: 'text/yaml' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading topology file:', error);
        throw error;
    }
}
