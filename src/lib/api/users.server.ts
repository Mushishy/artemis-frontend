/**
 * Server-side user management API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerLudusClient } from './server-api-client';
import type { 
    User, 
    UserRange
} from './types';

// ============================================================================
// USER MANAGEMENT (Ludus API)
// ============================================================================

/**
 * Get all users from Ludus
 */
export async function getUsers(): Promise<User[]> {
    try {
        const ludusClient = getServerLudusClient();
        const response = await ludusClient.get('/user/all');
        // Filter out the user with username 'root'
        return response.data.filter((user: User) => user.name !== 'root');
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

/**
 * Get user range information including VMs and network details
 */
export async function getUserRange(userID: string): Promise<UserRange> {
    try {
        const ludusClient = getServerLudusClient();
        const response = await ludusClient.get(`/range?userID=${userID}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching range for user ${userID}:`, error);
        throw error;
    }
}
