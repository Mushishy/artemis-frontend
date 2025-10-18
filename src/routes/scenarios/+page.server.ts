import { getScenariosDisplay } from '$lib/api/server/ctfd.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const scenarios = await getScenariosDisplay();
    return {
        scenarios
    };
};