import axios from 'axios';
import { dulusBaseUrl, dulusPort, dulusApiKey } from './settings';

// Configure axios for dulus API
const dulusClient = axios.create({
    baseURL: `${dulusBaseUrl}:${dulusPort}`,
    headers: {
        'X-API-Key': dulusApiKey,
        'accept': 'application/json'
    }
});

export interface UsersCheckResponse {
    allExist: boolean;
    missingUserIds: string[];
}

export interface TopologyCheckResponse {
    matchPoolTopology: boolean;
}

export interface StatusCheckResponse {
    allDeployed: boolean;
    results: Array<{
        state: string;
        userId: string;
    }>;
}

export interface Topology {
    topologyId: string;
    topologyName: string;
    createdAt: string;
}

// Check if all pool users exist
export async function checkPoolUsers(poolId: string): Promise<UsersCheckResponse> {
    try {
        const response = await dulusClient.get('/users/check', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool users:', error);
        throw error;
    }
}

// Check if pool topology matches
export async function checkPoolTopology(poolId: string): Promise<TopologyCheckResponse> {
    try {
        const response = await dulusClient.get('/range/config', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool topology:', error);
        throw error;
    }
}

// Check pool deployment status
export async function checkPoolStatus(poolId: string): Promise<StatusCheckResponse> {
    try {
        const response = await dulusClient.get('/range/status', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error checking pool status:', error);
        throw error;
    }
}

// Import missing users for a pool
export async function importMissingUsers(poolId: string): Promise<void> {
    try {
        await dulusClient.post('/users/import', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error importing missing users:', error);
        throw error;
    }
}

// Set topology for all users in pool
export async function setPoolTopology(poolId: string): Promise<void> {
    try {
        await dulusClient.post('/range/config', '', {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error setting pool topology:', error);
        throw error;
    }
}

// Get available topologies
export async function getTopologies(): Promise<Topology[]> {
	try {
		const response = await dulusClient.get('/topology');
		return response.data;
	} catch (error) {
		console.error('Error fetching topologies:', error);
		throw error;
	}
}

export async function downloadTopology(topologyId: string): Promise<{
	content: string;
	filename: string;
	createdAt: string;
}> {
	try {
		const response = await dulusClient.get(`/topology?topologyId=${topologyId}`);
		const { topologyFile, topologyName, createdAt } = response.data;
		
		// Base64 decode the topology file
		const decodedContent = atob(topologyFile);
		
		return {
			content: decodedContent,
			filename: topologyName,
			createdAt
		};
	} catch (error) {
		console.error('Error downloading topology:', error);
		throw error;
	}
}

// Fetch CTFd data for pool (only available if users, topology, and status are green)
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

// Download CTFd logins (only available if ctfdData is true)
export async function downloadCtfdLogins(poolId: string): Promise<string> {
	try {
		const response = await dulusClient.get('/ctfd/data/logins', {
			params: { poolId },
			headers: {
				'accept': 'text/plain'
			}
		});
		return response.data;
	} catch (error) {
		console.error('Error downloading CTFd logins:', error);
		throw error;
	}
}

// Download Wireguard configurations as ZIP
export async function downloadWireguardConfigs(poolId: string): Promise<Blob> {
	try {
		const response = await dulusClient.get('/range/access', {
			params: { poolId },
			headers: {
				'accept': 'application/zip'
			},
			responseType: 'blob'
		});
		return response.data;
	} catch (error) {
		console.error('Error downloading Wireguard configs:', error);
		throw error;
	}
}

// Change pool topology
export async function changePoolTopology(poolId: string, topologyId: string): Promise<void> {
    try {
        await dulusClient.patch('/pool/topology', { topologyId }, {
            params: { poolId }
        });
    } catch (error) {
        console.error('Error changing pool topology:', error);
        throw error;
    }
}

// Deploy pool
export async function deployPool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/deploy', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error deploying pool:', error);
        throw error;
    }
}

// Redeploy pool
export async function redeployPool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/redeploy', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error redeploying pool:', error);
        throw error;
    }
}

// Abort pool operations
export async function abortPool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/abort', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error aborting pool operations:', error);
        throw error;
    }
}

// Remove/destroy pool
export async function removePool(poolId: string): Promise<any> {
    try {
        const response = await dulusClient.post('/range/remove', '', {
            params: { poolId }
        });
        return response.data;
    } catch (error) {
        console.error('Error removing pool:', error);
        throw error;
    }
}


