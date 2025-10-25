import { getProxmoxStats } from '$lib/api/server/proxmox.server';
import { getAuthenticatedApiKey } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';
import type { ProxmoxStatsResponse } from '$lib/api/types';

const noProxmoxStats: ProxmoxStatsResponse = {
    users: 0,
    templates: 0,
    vms: 0,
    numberOfTopologies: 0,
    numberOfScenarios: 0,
    numberOfRoles: 0,
    numberOfPools: 0,
    cpuUsagePercentage: 0,
    maxCpu: 0,
    memoryUsedGiB: 0,
    memoryTotalGiB: 0,
    memoryFreeGiB: 0,
    diskUsedGiB: 0,
    diskTotalGiB: 0,
    uptimeFormatted: '0 days'
};

export const load: PageServerLoad = async (event) => {
    // Only load stats if user is authenticated
    const apiKey = await getAuthenticatedApiKey(event);
    
    if (!apiKey) {
        return {
            proxmoxStats: noProxmoxStats,
            authenticated: false
        };
    }

    try {
        const proxmoxStats = await getProxmoxStats(apiKey);
        return {
            proxmoxStats,
            authenticated: true
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            proxmoxStats: noProxmoxStats,
            authenticated: true
        };
    }
};