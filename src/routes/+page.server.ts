import { getProxmoxStats } from '$lib/api/proxmox.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const proxmoxStats = await getProxmoxStats();
    return {
        proxmoxStats
    };
};
