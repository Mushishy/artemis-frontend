import { getAnsibleRolesNormalized } from '$lib/api/roles.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const roles = await getAnsibleRolesNormalized();
        return {
            roles
        };
    } catch (error) {
        console.error('Error loading roles:', error);
        return {
            roles: []
        };
    }
};