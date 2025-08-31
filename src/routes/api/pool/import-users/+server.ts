import { json } from '@sveltejs/kit';
import { importMissingUsers } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { poolId } = await request.json();
        
        if (!poolId) {
            return json({ error: 'Pool ID is required' }, { status: 400 });
        }

        await importMissingUsers(poolId);

        return json({ success: true });
    } catch (error) {
        console.error('Error importing missing users:', error);
        return json({ error: 'Failed to import missing users' }, { status: 500 });
    }
};
