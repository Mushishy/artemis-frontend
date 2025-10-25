import { createServerDulusClient } from '../settings/server-api-client';
import type { ProxmoxStatsResponse } from '../types';

export async function getProxmoxStats(apiKey: string): Promise<ProxmoxStatsResponse> {
    try {
        const dulusClient = createServerDulusClient(apiKey);
        const response = await dulusClient.get('/stats/proxmox') 
        return response.data;
    } catch (error) {
        console.error('Error checking proxmox stats:', error);
        throw error;
    }
}
