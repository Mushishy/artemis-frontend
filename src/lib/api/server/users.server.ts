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
    const maxRetries = 2;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const ludusClient = createServerLudusClient(apiKey);
            const response = await ludusClient.get(`/range?userID=${userID}`);
            return response.data;
        } catch (error: any) {
            lastError = error;
            
            // If it's not a connection error, don't retry
            if (error.code !== 'ECONNRESET' && error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
                break;
            }
            
            // If this is the last attempt, don't wait
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    throw lastError;
}
