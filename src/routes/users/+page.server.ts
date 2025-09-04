import { getUsers } from '$lib/api/users.client';
import { formatDate } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
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
        console.error('Error loading users:', error);
        return {
            users: []
        };
    }
};
