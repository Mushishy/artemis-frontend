import { createServerDulusClient } from '../settings/server-api-client';
import { serverApiKey } from '../settings/settings-server';
import type { ProxmoxStatsResponse } from '../types';

export async function getProxmoxStats(): Promise<ProxmoxStatsResponse> {
    try {
        const dulusClient = createServerDulusClient(serverApiKey || '');
        const response = await dulusClient.get('/stats/proxmox') 
        return response.data;
    } catch (error) {
        console.error('Error checking proxmox stats:', error);
        throw error;
    }
}
