import { getTopologiesDisplay } from '$lib/api/server/topology.server';
import { getUsers } from '$lib/api/server/users.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated and get API key from JWT
    const apiKey = await requireAuth(event);
    
    try {
        const [topologies, usersResponse] = await Promise.all([
            getTopologiesDisplay(apiKey),
            getUsers(apiKey)
        ]);
        
        const users = usersResponse.map(item => ({
            name: item.name,
            userID: item.userID,
            isAdmin: item.isAdmin
        }));
        
        return {
            topologies,
            users
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            topologies: [],
            users: []
        };
    }
};
