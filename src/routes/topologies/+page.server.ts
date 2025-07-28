import { loadTopologies } from './data';
import type { PageServerLoad } from './$types';

export interface Topology {
    ID: string;
    Name: string;
    Created: string;
}

export const load: PageServerLoad = async () => {
    const topologies = await loadTopologies();
    return {
        topologies
    };
};
