import { getScenariosDisplay } from '$lib/api/server/ctfd.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const apiKey = await requireAuth(event);
    
    try {
        const scenarios = await getScenariosDisplay(apiKey);
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