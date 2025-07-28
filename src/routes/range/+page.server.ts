import { loadTopologies } from '../topologies/data.js';
import { getUsers } from '$lib/api/users.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const [topologies, usersResponse] = await Promise.all([
            loadTopologies(),
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
