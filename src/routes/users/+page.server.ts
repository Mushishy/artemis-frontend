import { getUsers } from '$lib/api/server/users.server';
import { requireAuth } from '$lib/utils/auth-guard';
import { formatDate } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // Require authentication - will redirect to / if not authenticated
    requireAuth(event);
    
    try {
        const response = await getUsers();
        
        const users = response.map(item => ({
            name: item.name,
            isAdmin: item.isAdmin,
            dateCreated: formatDate(item.dateCreated),
            userID: item.userID
        }));
        
        return {
            users
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            users: []
        };
    }
};
