import { json } from '@sveltejs/kit';
import { changePoolTopology } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { poolId, topologyId } = await request.json();
        
        if (!poolId || !topologyId) {
            return json({ error: 'Pool ID and Topology ID are required' }, { status: 400 });
        }

        await changePoolTopology(poolId, topologyId);

        return json({ success: true });
    } catch (error) {
        console.error('Error changing pool topology:', error);
        return json({ error: 'Failed to change pool topology' }, { status: 500 });
    }
};
