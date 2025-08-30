import { json } from '@sveltejs/kit';
import { deleteMultipleUsers } from '$lib/api/users.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userIDs } = await request.json();
        
        if (!userIDs || !Array.isArray(userIDs) || userIDs.length === 0) {
            return json({ error: 'User IDs array is required' }, { status: 400 });
        }
        
        await deleteMultipleUsers(userIDs);
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting multiple users:', error);
        return json({ error: 'Failed to delete users' }, { status: 500 });
    }
};
