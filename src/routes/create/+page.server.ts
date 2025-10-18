import { getTopologiesDisplay } from '$lib/api/server/topology.server';
import { getUsers } from '$lib/api/server/users.server';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
    try {
        const [topologies, usersResponse] = await Promise.all([
            getTopologiesDisplay(),
            getUsers()
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
        console.error('Error loading range data:', error);
        return {
            topologies: [],
            users: []
        };
    }
};
