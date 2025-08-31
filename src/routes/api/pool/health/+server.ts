import { json } from '@sveltejs/kit';
import { checkPoolUsers, checkPoolTopology, checkPoolStatus } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const poolId = url.searchParams.get('poolId');
        
        if (!poolId) {
            return json({ error: 'Pool ID is required' }, { status: 400 });
        }

        // Run all checks in parallel
        const [usersCheck, topologyCheck, statusCheck] = await Promise.allSettled([
            checkPoolUsers(poolId),
            checkPoolTopology(poolId),
            checkPoolStatus(poolId)
        ]);

        const response = {
            users: usersCheck.status === 'fulfilled' ? usersCheck.value : { error: 'Failed to check users' },
            topology: topologyCheck.status === 'fulfilled' ? topologyCheck.value : { error: 'Failed to check topology' },
            status: statusCheck.status === 'fulfilled' ? statusCheck.value : { error: 'Failed to check status' }
        };

        return json(response);
    } catch (error) {
        console.error('Error checking pool health:', error);
        return json({ error: 'Failed to check pool health' }, { status: 500 });
    }
};
