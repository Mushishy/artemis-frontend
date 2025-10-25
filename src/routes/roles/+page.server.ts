import { getAnsibleRolesNormalized } from '$lib/api/server/roles.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const apiKey = await requireAuth(event);
    
    try {
        const roles = await getAnsibleRolesNormalized(apiKey);
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