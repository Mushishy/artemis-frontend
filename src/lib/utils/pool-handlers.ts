import { 
    patchPoolUsers,
    checkUsersInPools,
    setPoolTopology,
    changePoolTopology,
    deployPool,
    redeployPool,
    abortPool,
    removePool as destroyPool,
    sharePool,
    unsharePool,
    checkSharingStatus as checkSharingStatusAPI,
    startTesting,
    stopTesting
} from '$lib/api/client/pools.client.js';

import { importMissingUsers } from '$lib/api/client/users.client.js';
import { fetchCtfdData, downloadCtfdLogins } from '$lib/api/client/ctfd.client.js';
import { downloadWireguardConfigs } from '$lib/api/client/pools.client.js';
import type { PatchUserRequest } from '$lib/api/types.js';

export class PoolHandlers {
    constructor(
        private poolId: string,
        private showAlert: (message: string, type: 'success' | 'error') => void
    ) {}

    async importUsers(missingUsers: string[]) {
        this.showAlert(`Creating ${missingUsers.length} users...`, 'success');
        
        try {
            const response: any = await importMissingUsers(this.poolId);
            
            if (response?.results && Array.isArray(response.results)) {
                const errors = response.results
                    .filter((result: any) => result.response?.error)
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (errors) {
                    this.showAlert(`Import errors:\n${errors}`, 'error');
                    return;
                }
            }
            
            this.showAlert(`Successfully imported ${missingUsers.length} users`, 'success');
        } catch (error: any) {
            this.handleError('Failed to import missing users', error);
        }
    }

    async patchUsers(users: PatchUserRequest[]) {
        try {
            this.showAlert(`Patching ${users.length} users...`, 'success');
            await patchPoolUsers(this.poolId, users);
            this.showAlert(`Successfully patched ${users.length} users`, 'success');
        } catch (error: any) {
            this.handleError('Failed to patch users', error);
        }
    }

    async checkUsersInPools(users: PatchUserRequest[]) {
        const usernames = users.map(u => u.user);
        const duplicates = usernames.filter((user, index) => usernames.indexOf(user) !== index);
        
        if (duplicates.length > 0) {
            const uniqueDuplicates = [...new Set(duplicates)];
            this.showAlert(`Duplicate users found in input: ${uniqueDuplicates.join(', ')}`, 'error');
            return;
        }

        try {
            const transformToUserId = (username: string): string => {
                return 'BATCH' + username.replace(/\s+/g, '').toLowerCase();
            };

            const userIds = users.map(u => transformToUserId(u.user));
            const results = await checkUsersInPools(userIds);
            
            const usersInPools = results.filter(result => result.exists);

            if (usersInPools.length > 0) {
                const userNames = usersInPools.map(result => result.userId).join(', ');
                this.showAlert(`User IDs already in pools: ${userNames}`, 'error');
            } else {
                this.showAlert('All users are available for patching', 'success');
            }
        } catch (error) {
            this.showAlert(`Failed to check users: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    }

    async setTopology() {
        try {
            const response: any = await setPoolTopology(this.poolId);
            this.handleTopologyResponse(response, 'Topology configuration requested');
        } catch (error: any) {
            this.handleTopologyError('Failed to set topology', error);
        }
    }

    async changeTopology(topologyId: string) {
        try {
            const response: any = await changePoolTopology(this.poolId, topologyId);
            this.handleTopologyResponse(response, `Topology change to ${topologyId} requested`);
        } catch (error: any) {
            this.handleTopologyError('Failed to change topology', error);
        }
    }

    async deployPool(concurrentRequests: number) {
        try {
            this.showAlert('Deploying pool', 'success');
            await deployPool(this.poolId, concurrentRequests);
            this.showAlert('Pool deployment requested', 'success');
        } catch (error: any) {
            this.handleError('Failed to deploy pool', error);
        }
    }

    async redeployPool(concurrentRequests: number) {
        try {
            this.showAlert('Redeploying pool', 'success');
            await redeployPool(this.poolId, concurrentRequests);
            this.showAlert('Pool redeployment requested', 'success');
        } catch (error: any) {
            this.handleError('Failed to redeploy pool', error);
        }
    }

    async abortPool() {
        try {
            this.showAlert('Aborting pool operations', 'success');
            await abortPool(this.poolId);
            this.showAlert('Pool abort requested', 'success');
        } catch (error: any) {
            this.handleError('Failed to abort pool operations', error);
        }
    }

    async destroyPool() {
        try {
            this.showAlert('Destroying pool', 'success');
            await destroyPool(this.poolId);
            this.showAlert('Pool destruction requested', 'success');
        } catch (error: any) {
            this.handleError('Failed to destroy pool', error);
        }
    }

    async fetchCtfdData() {
        try {
            this.showAlert('Fetching CTFd data to pool...', 'success');
            const response: any = await fetchCtfdData(this.poolId);
            this.handleCtfdResponse(response, 'CTFd data fetched successfully');
        } catch (error: any) {
            this.handleCtfdError('Failed to fetch CTFd data', error);
        }
    }

    async downloadCtfdLogins() {
        try {
            this.showAlert('Downloading CTFd logins...', 'success');
            const loginData = await downloadCtfdLogins(this.poolId);
            
            const blob = new Blob([loginData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.poolId}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showAlert('CTFd logins downloaded successfully', 'success');
        } catch (error: any) {
            this.handleError('Failed to download CTFd logins', error);
        }
    }

    async downloadWireguard() {
        try {
            this.showAlert('Downloading Wireguard configurations...', 'success');
            await downloadWireguardConfigs(this.poolId);
            this.showAlert('Wireguard configurations downloaded successfully', 'success');
        } catch (error: any) {
            this.handleError('Failed to download Wireguard configurations', error);
        }
    }

    async sharePool() {
        try {
            this.showAlert('Sending sharing request...', 'success');
            const response = await sharePool(this.poolId);
            this.handleSharingResponse(response, 'Sharing request completed');
        } catch (error: any) {
            this.handleError('Failed to share pool', error);
        }
    }

    async unsharePool() {
        try {
            this.showAlert('Sending unsharing request...', 'success');
            const response = await unsharePool(this.poolId);
            
            // Handle detailed response similar to sharing
            this.handleUnsharingResponse(response, 'Unsharing request completed');
            
            // Still verify the status for consistency
            const checkData = await checkSharingStatusAPI(this.poolId);
            return checkData.shared === false;
        } catch (error: any) {
            this.handleError('Failed to unshare pool', error);
            return false;
        }
    }

    private handleTopologyResponse(response: any, successMessage: string) {
        if (response?.results && Array.isArray(response.results)) {
            const errorResults = response.results.filter((result: any) => result.response?.error);
            
            if (errorResults.length > 0) {
                const errorSummary = `Topology configuration failed for ${errorResults.length} user(s):`;
                const errorDetails = errorResults
                    .map((result: any) => `• ${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                this.showAlert(`${errorSummary}\n\n${errorDetails}`, 'error');
                return;
            }
        }
        
        this.showAlert(successMessage, 'success');
    }

    private handleTopologyError(baseMessage: string, error: any) {
        let errorMessage = baseMessage;
        
        if (error.response?.data) {
            const responseData = error.response.data;
            
            if (responseData.errors && Array.isArray(responseData.errors)) {
                const errorDetails = responseData.errors
                    .map((errorMsg: string) => `• ${errorMsg}`)
                    .join('\n');
                errorMessage = `${baseMessage}:\n\n${errorDetails}`;
            } else if (responseData.results && Array.isArray(responseData.results)) {
                const errorResults = responseData.results.filter((result: any) => result.response?.error);
                
                if (errorResults.length > 0) {
                    const errorDetails = errorResults
                        .map((result: any) => `• ${result.userId}: ${result.response.error}`)
                        .join('\n');
                    errorMessage = `${baseMessage} for ${errorResults.length} user(s):\n\n${errorDetails}`;
                }
            } else if (responseData.error) {
                errorMessage = `${baseMessage}:\n\n${responseData.error}`;
            }
        }
        
        this.showAlert(errorMessage, 'error');
    }

    private handleCtfdResponse(response: any, successMessage: string) {
        if (response?.results && Array.isArray(response.results)) {
            const errors = response.results
                .filter((result: any) => result.response?.error)
                .map((result: any) => `${result.userId}: ${result.response.error}`)
                .join('\n');
            
            if (errors) {
                this.showAlert(`CTFd errors:\n${errors}`, 'error');
                return;
            }
        }
        
        this.showAlert(successMessage, 'success');
    }

    private handleCtfdError(baseMessage: string, error: any) {
        let errorMessage = baseMessage;
        
        if (error.response?.data) {
            const responseData = error.response.data;
            
            if (responseData.results && Array.isArray(responseData.results)) {
                const errors = responseData.results
                    .filter((result: any) => result.response?.error)
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (errors) {
                    errorMessage = `CTFd errors:\n${errors}`;
                }
            } else if (responseData.error) {
                errorMessage = responseData.error;
            } else if (typeof responseData === 'string') {
                errorMessage = responseData;
            }
        }
        
        this.showAlert(errorMessage, 'error');
    }

    private handleSharingResponse(response: any, successMessage: string) {
        if (response?.results && Array.isArray(response.results)) {
            const successResults = response.results.filter((result: any) => result.response?.result);
            const errorResults = response.results.filter((result: any) => result.response?.error);
            
            let message = '';
            
            if (successResults.length > 0) {
                const successDetails = successResults
                    .map((result: any) => `${result.userId}: ${result.response.result}`)
                    .join('\n');
                message += `Successfully shared with ${successResults.length} user(s):\n\n${successDetails}`;
            }
            
            if (errorResults.length > 0) {
                const errorDetails = errorResults
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (message) message += '\n\n';
                message += `Failed to share with ${errorResults.length} user(s):\n\n${errorDetails}`;
            }
            
            // Show success if any succeeded, error if all failed
            const type = successResults.length > 0 ? 'success' : 'error';
            this.showAlert(message || successMessage, type);
        } else {
            this.showAlert(successMessage, 'success');
        }
    }

    private handleUnsharingResponse(response: any, successMessage: string) {
        if (response?.results && Array.isArray(response.results)) {
            const successResults = response.results.filter((result: any) => result.response?.result);
            const errorResults = response.results.filter((result: any) => result.response?.error);
            
            let message = '';
            
            if (successResults.length > 0) {
                const successDetails = successResults
                    .map((result: any) => `${result.userId}: ${result.response.result}`)
                    .join('\n');
                message += `Successfully unshared from ${successResults.length} user(s):\n\n${successDetails}`;
            }
            
            if (errorResults.length > 0) {
                const errorDetails = errorResults
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (message) message += '\n\n';
                message += `Failed to unshare from ${errorResults.length} user(s):\n\n${errorDetails}`;
            }
            
            // Show success if any succeeded, error if all failed
            const type = successResults.length > 0 ? 'success' : 'error';
            this.showAlert(message || successMessage, type);
        } else {
            this.showAlert(successMessage, 'success');
        }
    }

    async startTesting() {
        try {
            this.showAlert('Sending testing start request...', 'success');
            const response = await startTesting(this.poolId);
            this.handleTestingResponse(response, 'Testing start request completed');
        } catch (error: any) {
            this.handleError('Failed to start testing', error);
        }
    }

    async stopTesting() {
        try {
            this.showAlert('Sending testing stop request...', 'success');
            const response = await stopTesting(this.poolId);
            this.handleTestingResponse(response, 'Testing stop request completed');
        } catch (error: any) {
            this.handleError('Failed to stop testing', error);
        }
    }

    private handleTestingResponse(response: any, successMessage: string) {
        if (response?.results && Array.isArray(response.results)) {
            const successResults = response.results.filter((result: any) => result.response?.status === 'ok' || result.response?.result);
            const errorResults = response.results.filter((result: any) => result.response?.status !== 'ok' && result.response?.error);
            
            let message = '';
            
            if (successResults.length > 0) {
                const successDetails = successResults
                    .map((result: any) => `${result.userId}: ${result.response.status || result.response.result || 'Success'}`)
                    .join('\n');
                message += `Testing operation succeeded for ${successResults.length} user(s):\n\n${successDetails}`;
            }
            
            if (errorResults.length > 0) {
                const errorDetails = errorResults
                    .map((result: any) => `${result.userId}: ${result.response.error || result.response.status || 'Unknown error'}`)
                    .join('\n');
                
                if (message) message += '\n\n';
                message += `Testing operation failed for ${errorResults.length} user(s):\n\n${errorDetails}`;
            }
            
            // Show success if any succeeded, error if all failed
            const type = successResults.length > 0 ? 'success' : 'error';
            this.showAlert(message || successMessage, type);
        } else {
            this.showAlert(successMessage, 'success');
        }
    }

    private handleError(baseMessage: string, error: any) {
        let errorMessage = baseMessage;
        
        if (error.response?.data) {
            const responseData = error.response.data;
            if (responseData.error) {
                errorMessage = responseData.error;
            } else if (typeof responseData === 'string') {
                errorMessage = responseData;
            }
        }
        
        this.showAlert(errorMessage, 'error');
    }
}
