import { getServerDulusClient } from './server-api-client';
import type { ProxmoxStatsResponse } from './types';

export async function getProxmoxStats(): Promise<ProxmoxStatsResponse> {
    try {
        const dulusClient = getServerDulusClient();
        const response = await dulusClient.get('/stats/proxmox') 
        return response.data;
    } catch (error) {
        console.error('Error checking proxmox stats:', error);
        throw error;
    }
}
