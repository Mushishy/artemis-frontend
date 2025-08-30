import { json } from '@sveltejs/kit';
import { createUser } from '$lib/api/users.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { name, isAdmin } = await request.json();
        
        if (!name?.trim()) {
            return json({ error: 'Username is required' }, { status: 400 });
        }
        
        const user = await createUser(name.trim(), Boolean(isAdmin));
        return json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        return json({ error: 'Failed to create user' }, { status: 500 });
    }
};
