import { getDulusClient } from './api-client';

const dulusClient = getDulusClient();

export async function downloadCtfdLogins(poolId: string): Promise<string> {
    try {
        const response = await dulusClient.get('/ctfd/data/logins', {
            params: { poolId },
            headers: { 'accept': 'text/plain' }
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading CTFd logins:', error);
        throw error;
    }
}
