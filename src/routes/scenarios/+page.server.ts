import { getScenariosDisplay } from '$lib/api/ctfd_scenario.client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const scenarios = await getScenariosDisplay();
    return {
        scenarios
    };
};