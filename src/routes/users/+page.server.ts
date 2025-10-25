import { getUsers } from '$lib/api/server/users.server';
import { requireAuth } from '$lib/utils/auth-guard';
import { formatDate } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    const apiKey = await requireAuth(event);
    
    try {
        const response = await getUsers(apiKey);
        
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
