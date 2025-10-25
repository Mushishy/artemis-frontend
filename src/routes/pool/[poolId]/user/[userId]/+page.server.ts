import { getUserRange } from '$lib/api/server/users.server';
import { requireAuth } from '$lib/utils/auth-guard';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated and return API key
    const apiKey = await requireAuth(event);
    
    try {
        const { userId, poolId } = event.params;
        
        if (!userId) {
            throw error(400, 'User ID is required');
        }
        
        if (!poolId) {
            throw error(400, 'Pool ID is required');
        }

        const userRange = await getUserRange(userId, apiKey);

        // Check if userRange has VMs array and if all VMs are powered off
        if (userRange.VMs && userRange.VMs.length > 0) {
            const allVmsPoweredOff = userRange.VMs.every(vm=> !vm.poweredOn);
            if (allVmsPoweredOff) {
                return {
                    error: true,
                    errorType: 'RANGE_STOPPED',
                    userId,
                    poolId,
                    message: `User range ${userId} is stopped. All VMs are powered off.`
                };
            }
        } else {
            // Range exists but has no VMs
            return {
                error: true,
                errorType: 'NO_VMS',
                userId,
                poolId,
                message: `User range ${userId} has no VMs configured.`
            };
        }
        
        return {
            userRange,
            userId,
            poolId
        };
    } catch (err: any) {
        console.error('Error loading user range:', err);
        
        if (err.response?.status === 404) {
            // User has no range or range was destroyed
            return {
                error: true,
                errorType: 'NO_RANGE',
                userId: event.params.userId,
                poolId: event.params.poolId,
                message: `User ${event.params.userId} has no range. The range may not have been deployed yet or has been destroyed.`
            };
        }
        
        if (err.response?.status === 403) {
            // Access forbidden
            return {
                error: true,
                errorType: 'ACCESS_DENIED',
                userId: event.params.userId,
                poolId: event.params.poolId,
                message: `Access denied for user ${event.params.userId}. You may not have permission to view this range.`
            };
        }
        
        // Other server errors
        throw error(500, `Failed to load user range data: ${err.message || 'Unknown error'}`);
    }
};