import { getDulusClient } from './api-client';

const dulusClient = getDulusClient();

// Attempts to retrive CTFD data from logs after deployment is successful
export async function fetchCtfdData(poolId: string): Promise<void> {
    try {
        await dulusClient.put('/ctfd/data', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error fetching CTFd data:', error);
        throw error;
    }
}

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

export async function getPoolFlags(poolId: string): Promise<boolean> {
    try {
        const response = await dulusClient.get('/ctfd/data', {
            params: { poolId }
        });
        return Boolean(response.data?.ctfdData && response.data.ctfdData.length > 0);
    } catch (error) {
        console.error('Error loading pool flags:', error);
        return false;
    }
}
