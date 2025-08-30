import { json } from '@sveltejs/kit';
import { deleteUser } from '$lib/api/users.server';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const { userID } = params;
        
        if (!userID) {
            return json({ error: 'User ID is required' }, { status: 400 });
        }
        
        await deleteUser(userID);
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return json({ error: 'Failed to delete user' }, { status: 500 });
    }
};
