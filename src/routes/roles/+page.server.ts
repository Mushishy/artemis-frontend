import { getAnsibleRolesNormalized } from '$lib/api/server/roles.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    requireAuth(event);
    
    try {
        const roles = await getAnsibleRolesNormalized();
        return {
            roles
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            roles: []
        };
    }
};