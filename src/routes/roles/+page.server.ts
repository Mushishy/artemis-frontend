import { loadRoles } from './data.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const roles = await loadRoles();
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