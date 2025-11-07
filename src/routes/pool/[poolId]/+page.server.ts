import type { PageServerLoad } from './$types';
import type { PoolUserTeam } from '$lib/api/types';
import { error } from '@sveltejs/kit';
import { getPoolDetail } from '$lib/api/server/pools.server.js';
import { requireAuth } from '$lib/utils/auth-guard';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    const apiKey = await requireAuth(event);
    
    const { poolId } = event.params;
    
    if (!poolId) {
        throw error(404, 'Pool not found');
    }
    
    try {
        const poolDetail = await getPoolDetail(apiKey, poolId);
        
        // Process poolDetail to extract unique mainUsers from usersAndTeams
        if (poolDetail && poolDetail.usersAndTeams) {
            const uniqueMainUsers = [...new Set(
                poolDetail.usersAndTeams
                    .map((userTeam: PoolUserTeam) => userTeam.mainUserId)
                    .filter((mainUserId: string) => mainUserId) // Filter out any null/undefined values
            )];
            
            poolDetail.mainUsers = uniqueMainUsers;
        }
        
        return {
            poolId,
            poolDetail
        };
    } catch (err) {
        console.error('Error loading pool detail:', err);
        return {
            poolId,
            poolDetail: null
        };
    }
};
