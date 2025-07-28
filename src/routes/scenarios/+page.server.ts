import { loadScenarios } from './data';
import type { PageServerLoad } from './$types';

export interface Scenario {
    ID: string;
    Name: string;
    Created: string;
}

export const load: PageServerLoad = async () => {
    const scenarios = await loadScenarios();
    return {
        scenarios
    };
};