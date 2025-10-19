import { getScenariosDisplay } from '$lib/api/server/ctfd.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    requireAuth(event);
    
    try {
        const scenarios = await getScenariosDisplay();
        return {
            scenarios
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            scenarios: []
        };
    }
};