import { getUserRange } from '$lib/api/users.server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    try {
        const { userId, poolId } = params;
        
        if (!userId) {
            throw error(400, 'User ID is required');
        }
        
        if (!poolId) {
            throw error(400, 'Pool ID is required');
        }

        const userRange = await getUserRange(userId);
        
        return {
            userRange,
            userId,
            poolId
        };
    } catch (err: any) {
        console.error('Error loading user range:', err);
        
        if (err.response?.status === 404) {
            // Return error state instead of throwing
            return {
                error: true,
                userId: params.userId,
                poolId: params.poolId,
                message: err.response?.data?.error || `User ${params.userId} has no range`
            };
        }
        
        throw error(500, 'Failed to load user range data');
    }
};