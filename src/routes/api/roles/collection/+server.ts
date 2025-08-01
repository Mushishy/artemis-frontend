import { installCollection, type InstallCollectionRequest } from '$lib/api/roles.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data: InstallCollectionRequest = await request.json();
        const result = await installCollection(data);
        return json(result);
    } catch (error) {
        console.error('Error installing collection:', error);
        return json({ error: 'Failed to install collection' }, { status: 500 });
    }
};
