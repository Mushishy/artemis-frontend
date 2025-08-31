import { json } from '@sveltejs/kit';
import { setPoolTopology } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { poolId } = await request.json();
        
        if (!poolId) {
            return json({ error: 'Pool ID is required' }, { status: 400 });
        }

        await setPoolTopology(poolId);

        return json({ success: true });
    } catch (error) {
        console.error('Error setting pool topology:', error);
        return json({ error: 'Failed to set pool topology' }, { status: 500 });
    }
};
