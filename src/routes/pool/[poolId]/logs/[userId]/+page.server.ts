import { requireAuth } from '$lib/utils/auth-guard';
import { error, type RequestEvent } from '@sveltejs/kit';

export const load = async (event: RequestEvent) => {
    const apiKey = await requireAuth(event);
    
    const { userId, poolId } = event.params;
    
    if (!userId) {
        throw error(400, 'User ID is required');
    }
    
    if (!poolId) {
        throw error(400, 'Pool ID is required');
    }
    
    return {
        userId,
        poolId,
        // Pass the authenticated status to the client
        authenticated: true
    };
};