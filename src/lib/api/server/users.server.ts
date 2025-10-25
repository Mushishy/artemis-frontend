import { createServerLudusClient } from '../settings/server-api-client';
import type { User, UserRange } from '../types';

export async function getUsers(apiKey: string): Promise<User[]> {
    try {
        const ludusClient = createServerLudusClient(apiKey);
        const response = await ludusClient.get('/user/all');
        // Filter out the user with username 'root'
        return response.data.filter((user: User) => user.name !== 'root');
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

export async function getUserRange(userID: string, apiKey: string): Promise<UserRange> {
    try {
        const ludusClient = createServerLudusClient(apiKey);
        const response = await ludusClient.get(`/range?userID=${userID}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching range for user ${userID}:`, error);
        throw error;
    }
}
