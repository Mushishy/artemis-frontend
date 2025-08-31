import { json } from '@sveltejs/kit';
import { redeployPool } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { poolId } = await request.json();
        
        if (!poolId) {
            return json({ error: 'Pool ID is required' }, { status: 400 });
        }

        await redeployPool(poolId);
        
        return json({ success: true });
    } catch (error: any) {
        console.error('Error redeploying pool:', error);
        return json({ 
            error: error.message || 'Failed to redeploy pool',
            details: error.response?.data 
        }, { status: 500 });
    }
};
