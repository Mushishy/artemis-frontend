import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ludusBaseUrl, ludusAdminPort, ludusApiKey } from '$lib/api/settings';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { name, userID, isAdmin } = await request.json();

        const response = await fetch(`${ludusBaseUrl}:${ludusAdminPort}/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': ludusApiKey,
            },
            body: JSON.stringify({
                name,
                userID,
                isAdmin
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to add admin user: ${response.statusText}`);
        }

        const result = await response.json();
        return json(result);
    } catch (error) {
        console.error('Error adding admin user:', error);
        return json({ error: 'Failed to add admin user' }, { status: 500 });
    }
};
