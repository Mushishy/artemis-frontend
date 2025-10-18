import { getProxmoxStats } from '$lib/api/server/proxmox.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const proxmoxStats = await getProxmoxStats();
    return {
        proxmoxStats
    };
};
