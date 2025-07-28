import { getWireGuardConfig } from '$lib/api/users.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const userID = url.searchParams.get('userID');
    
    if (!userID) {
        return json({ error: 'userID parameter is required' }, { status: 400 });
    }
    
    try {
        const config = await getWireGuardConfig(userID);
        
        // Return the config as a downloadable file
        return new Response(config, {
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename="${userID}.conf"`
            }
        });
    } catch (error) {
        console.error('Error fetching WireGuard config:', error);
        return json({ error: 'Failed to fetch WireGuard configuration' }, { status: 500 });
    }
};
