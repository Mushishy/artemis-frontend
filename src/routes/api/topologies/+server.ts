import { json } from '@sveltejs/kit';
import { getTopologies } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const topologies = await getTopologies();
        return json(topologies);
    } catch (error) {
        console.error('Error getting topologies:', error);
        return json({ error: 'Failed to get topologies' }, { status: 500 });
    }
};
