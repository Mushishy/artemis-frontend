import { loadScenarios } from './data';
import type { Scenario } from '$lib/api/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const scenarios = await loadScenarios();
    return {
        scenarios
    };
};