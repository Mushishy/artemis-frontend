import { json } from '@sveltejs/kit';
import { getUserLogs } from '$lib/api/ludus.client.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, url }) => {
    try {
        const { userId } = params;
        
        if (!userId) {
            return json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get query parameters
        const tail = parseInt(url.searchParams.get('tail') || '100');
        const resumeline = parseInt(url.searchParams.get('resumeline') || '0');

        // Fetch logs from Ludus API
        const logData = await getUserLogs(userId, tail, resumeline);
        
        return json(logData);
    } catch (error: any) {
        console.error('Error fetching user logs:', error);
        
        let errorMessage = 'Failed to fetch user logs';
        if (error.response?.status === 404) {
            errorMessage = 'User not found or no logs available';
        } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        }
        
        return json(
            { error: errorMessage },
            { status: error.response?.status || 500 }
        );
    }
};
