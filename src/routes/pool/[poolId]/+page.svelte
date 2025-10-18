<script lang="ts">
    import { goto } from '$app/navigation';
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Alert from '$lib/components/ui/alert';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { 
        RefreshCw, 
        AlertCircle, 
        CheckCircle2, 
        X,
        Download,
        Hand,
        Users,
        Network,
        Check,
        ChevronsUpDown,
        Map,
        FileText,
        Search,
        Share2,
        ArrowLeft,
        GlobeLock,
        Flag
    } from 'lucide-svelte';
    import type { PoolDetail, PoolDetailData, PoolHealthCheck, PatchUserRequest } from '$lib/api/types.js';
    import { 
        getPoolDetail, 
        refreshPoolData,  
        downloadWireguardConfigs,
        checkPoolHealth,
        setPoolTopology,
        changePoolTopology,
        deployPool,
        redeployPool,
        abortPool,
        removePool as destroyPool,
        patchPoolUsers,
        checkSharingStatus as checkSharingStatusAPI,
        sharePool,
        unshareSharedPool,
        checkUsersInPools
    } from '$lib/api/client/pools.client.js';

    import { downloadCtfdLogins, fetchCtfdData } from '$lib/api/client/ctfd.client.js';

    import { importMissingUsers } from '$lib/api/client/users.client.js';
    import { getTopologies, getTopology, downloadTopologyFile } from '$lib/api/client/topology.client.js';
    import { formatDate } from '$lib/utils';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let poolDetail: PoolDetail | null = $state(data.poolDetail || null);
    let poolData: PoolDetailData = $state({
        users: null,
        topology: null,
        status: null,
        flags: null,
        isLoading: true
    });
    let healthCheck: PoolHealthCheck = $state({
        users: null,
        topology: null,
        status: null,
        isLoading: true
    });
    let isRefreshing = $state(false);
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Sharing state
    let sharingStatus = $state<{ shared: boolean; isLoading: boolean }>({ shared: false, isLoading: false });
    
    // Loading states - no initial loading if we have pool detail from server
    let isInitialLoading = $state(!data.poolDetail);
    let loadingError = $state<string | null>(null);
    
    // Only start client-side loading if we don't have server data
    if (!data.poolDetail) {
        loadPoolData();
    } else {
        // We have server data, load additional data in background
        loadAdditionalData();
    }
    
    // Load topologies in background immediately
    getTopologies().then(rawTopologies => {
        topologyOptions = rawTopologies.map((topology: any) => ({
            value: topology.topologyId,
            label: topology.topologyName,
            description: `ID: ${topology.topologyId}`
        }));
    }).catch(error => {
        console.error('Failed to load topologies:', error);
        // Fallback to sample data
        topologyOptions = [
            { value: 'topo1', label: 'Basic Network', description: 'ID: topo1' },
            { value: 'topo2', label: 'Advanced Lab', description: 'ID: topo2' },
            { value: 'topo3', label: 'Security Test', description: 'ID: topo3' }
        ];
    });
    
    // Dialog state
    let usersDialogOpen = $state(false);
    let topologyDialogOpen = $state(false);
    let statusDialogOpen = $state(false);
    let sharingDialogOpen = $state(false);
    let accessDialogOpen = $state(false);
    let userActionType: 'import' | 'patch' = $state('import');
    let topologyActionType: 'set' | 'change' = $state('set');
    let statusActionType: 'deploy' | 'redeploy' | 'abort' | 'destroy' = $state('deploy');
    let missingUsers = $derived(healthCheck.users?.missingUserIds || []); // Use actual data from health check
    let patchUserInput = $state('');
    let selectedTopologyId = $state('');
    let topologyComboboxOpen = $state(false);
    let topologyOptions = $state<any[]>([]);
    let currentTopologyData = $state<{topologyId: string; topologyName: string; topologyFile?: string} | null>(null);
    let isLoadingCurrentTopology = $state(false);
    
    async function loadAdditionalData() {
        // Load background data when we already have pool detail from server
        try {
            Promise.all([
                // Load pool data
                refreshPoolData(data.poolId).then(result => {
                    poolData = result;
                }).catch(error => {
                    console.error('❌ Error refreshing pool data:', error);
                }),
                
                // Load health checks
                checkPoolHealth(data.poolId).then(result => {
                    healthCheck = result;
                }).catch(error => {
                    console.error('❌ Error checking pool health:', error);
                    healthCheck = {
                        users: null,
                        topology: null,
                        status: null,
                        isLoading: false
                    };
                })
            ]).finally(() => {
                // Load sharing status for SHARED pools after other data
                if (poolDetail?.type === 'SHARED') {
                    checkSharingStatus().catch(error => {
                        console.error('❌ Error checking sharing status:', error);
                    });
                }
            });
        } catch (error) {
            console.error('❌ Error loading additional data:', error);
        }
    }
    
    async function loadPoolData() {
        try {
            isInitialLoading = true;
            loadingError = null;
            
            // Load pool detail first - this is critical and fast
            try {
                poolDetail = await getPoolDetail(data.poolId);
                
                // Once we have basic pool info, show the UI immediately
                isInitialLoading = false;
            } catch (error) {
                console.error('❌ Error loading pool detail:', error);
                loadingError = 'Failed to load pool detail - check if dulus API is running';
                isInitialLoading = false;
                return;
            }
            
            // Load additional data in background (non-blocking)
            Promise.all([
                // Load pool data
                refreshPoolData(data.poolId).then(result => {
                    poolData = result;
                }).catch(error => {
                    console.error('❌ Error refreshing pool data:', error);
                }),
                
                // Load health checks
                checkPoolHealth(data.poolId).then(result => {
                    healthCheck = result;
                }).catch(error => {
                    console.error('❌ Error checking pool health:', error);
                    healthCheck = {
                        users: null,
                        topology: null,
                        status: null,
                        isLoading: false
                    };
                })
            ]).finally(() => {
                // Load sharing status for SHARED pools after other data
                if (poolDetail?.type === 'SHARED') {
                    checkSharingStatus().catch(error => {
                        console.error('❌ Error checking sharing status:', error);
                    });
                }
            });
        } catch (error) {
            console.error('❌ Critical error loading pool data:', error);
            loadingError = 'Critical error loading pool data';
            isInitialLoading = false;
        }
    }

    async function handleRefresh() {
        isRefreshing = true;
        try {
            poolData = { ...poolData, isLoading: true };
            healthCheck = { ...healthCheck, isLoading: true };
            
            // Refresh both pool data and health checks in parallel
            const [poolDataResult, healthCheckResult] = await Promise.all([
                refreshPoolData(data.poolId),
                checkPoolHealth(data.poolId)
            ]);
            
            poolData = poolDataResult;
            healthCheck = healthCheckResult;

            // Also refresh sharing status for SHARED pools
            if (poolDetail?.type === 'SHARED') {
                await checkSharingStatus();
            }

            showAlert('Pool data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing pool data:', error);
            showAlert('Failed to refresh pool data', 'error');
        } finally {
            isRefreshing = false;
        }
    }

    // Helper functions for refreshing specific parts
    async function loadPoolDetail() {
        try {
            poolDetail = await getPoolDetail(data.poolId);
        } catch (error) {
            console.error('❌ Error loading pool detail:', error);
            throw error;
        }
    }

    async function refreshHealthCheck() {
        try {
            healthCheck = { ...healthCheck, isLoading: true };
            healthCheck = await checkPoolHealth(data.poolId);
        } catch (error) {
            console.error('❌ Error refreshing health check:', error);
            throw error;
        }
    }

    // Access dialog handlers
    async function handleFetchCtfdData() {
        // Check if users, topology, and status are all green (true)
        const canFetch = healthCheck.users?.allExist && 
                        healthCheck.topology?.matchPoolTopology && 
                        healthCheck.status?.allDeployed;
        
        if (!canFetch) {
            showAlert('CTFd data can only be fetched when Users, Topology, and Status are all green', 'error');
            return;
        }

        try {
            showAlert('Fetching CTFd data to pool...', 'success');
            const response: any = await fetchCtfdData(data.poolId);
            
            // Check if response contains errors
            if (response?.results && Array.isArray(response.results)) {
                const errors = response.results
                    .filter((result: any) => result.response?.error)
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (errors) {
                    showAlert(`CTFd errors:\n${errors}`, 'error');
                    accessDialogOpen = false;
                    return;
                }
            }
            
            showAlert('CTFd data fetched successfully', 'success');
            // Refresh pool detail to update ctfdData status
            await loadPoolDetail();
        } catch (error: any) {
            console.error('Error fetching CTFd data:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to fetch CTFd data';
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle structured error response with results array
                if (responseData.results && Array.isArray(responseData.results)) {
                    const errors = responseData.results
                        .filter((result: any) => result.response?.error)
                        .map((result: any) => `${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    if (errors) {
                        errorMessage = `CTFd errors:\n${errors}`;
                    }
                } else if (responseData.error) {
                    // Handle simple error response
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    // Handle plain text error
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        accessDialogOpen = false;
    }

    async function handleDownloadCtfdLogins() {
        // Check if ctfdData is true
        if (!poolDetail?.ctfdData) {
            showAlert('CTFd logins can only be downloaded when CTFd data is available (green access indicator)', 'error');
            return;
        }

        try {
            showAlert('Downloading CTFd logins...', 'success');
            const loginData = await downloadCtfdLogins(data.poolId);
            
            // Create and download the CSV file with pool ID as filename
            const blob = new Blob([loginData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.poolId}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert('CTFd logins downloaded successfully', 'success');
        } catch (error: any) {
            console.error('Error downloading CTFd logins:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to download CTFd logins';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        accessDialogOpen = false;
    }

    async function handleDownloadWireguard() {
        try {
            showAlert('Downloading Wireguard configurations...', 'success');
            await downloadWireguardConfigs(data.poolId);
            showAlert('Wireguard configurations downloaded successfully', 'success');
        } catch (error: any) {
            console.error('Error downloading Wireguard configs:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to download Wireguard configurations';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        accessDialogOpen = false;
    }

    // User dialog handlers
    async function handleImportUsers() {
        // Close dialog immediately and show notification since this is a long-running process
        usersDialogOpen = false;
        showAlert(`Creating ${missingUsers.length} users...`, 'success');
        
        try {
            const response: any = await importMissingUsers(data.poolId);
            
            // Check if response contains errors
            if (response?.results && Array.isArray(response.results)) {
                const errors = response.results
                    .filter((result: any) => result.response?.error)
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (errors) {
                    showAlert(`Import errors:\n${errors}`, 'error');
                    return;
                }
            }
            
            showAlert(`Successfully imported ${missingUsers.length} users`, 'success');
            // Refresh health check to update the status
            healthCheck = await checkPoolHealth(data.poolId);
        } catch (error: any) {
            console.error('Failed to import missing users:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to import missing users';
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle structured error response with results array
                if (responseData.results && Array.isArray(responseData.results)) {
                    const errors = responseData.results
                        .filter((result: any) => result.response?.error)
                        .map((result: any) => `${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    if (errors) {
                        errorMessage = `Import errors:\n${errors}`;
                    }
                } else if (responseData.error) {
                    // Handle simple error response
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    // Handle plain text error
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
    }

    async function handlePatchUsers() {
        const users = parseBulkUsers(patchUserInput);
        if (users.length === 0) {
            showAlert('Please enter users to patch', 'error');
            return;
        }

        try {
            showAlert(`Patching ${users.length} users...`, 'success');
            await patchPoolUsers(data.poolId, users);
            showAlert(`Successfully patched ${users.length} users`, 'success');
            
            // Refresh pool data to show updated users
            await Promise.all([
                loadPoolDetail(),
                refreshHealthCheck()
            ]);
        } catch (error: any) {
            console.error('Error patching users:', error);
            
            let errorMessage = 'Failed to patch users';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        
        usersDialogOpen = false;
        patchUserInput = '';
    }

    async function handleCheckPatchUsers() {
        const users = parseBulkUsers(patchUserInput);
        if (users.length === 0) {
            showAlert('Please enter users to check', 'error');
            return;
        }

        // Check for duplicates within the input
        const usernames = users.map(u => u.user);
        const duplicates = usernames.filter((user, index) => usernames.indexOf(user) !== index);
        if (duplicates.length > 0) {
            const uniqueDuplicates = [...new Set(duplicates)];
            showAlert(`Duplicate users found in input: ${uniqueDuplicates.join(', ')}`, 'error');
            return;
        }

        try {
            // Transform usernames to user IDs with BATCH prefix (like in create pool)
            const transformToUserId = (username: string): string => {
                return 'BATCH' + username.replace(/\s+/g, '').toLowerCase();
            };

            const userIds = users.map(u => transformToUserId(u.user));
            const results = await checkUsersInPools(userIds);
            
            const usersInPools = results.filter(result => result.exists);

            if (usersInPools.length > 0) {
                const userNames = usersInPools.map(result => result.userId).join(', ');
                showAlert(`User IDs already in pools: ${userNames}`, 'error');
            } else {
                showAlert('All users are available for patching', 'success');
            }
        } catch (error) {
            showAlert(`Failed to check users: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    }

    // Parse bulk user input from create page
    function parseBulkUsers(input: string): PatchUserRequest[] {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: PatchUserRequest[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(',').map(part => part.trim());
            if (parts.length >= 1) {
                users.push({
                    user: parts[0],
                    team: parts.length >= 2 ? parts[1] : undefined
                });
            }
        }
        
        return users;
    }

    async function handleSetTopology() {
        try {
            const response: any = await setPoolTopology(data.poolId);
            
            // Check if response contains errors
            if (response?.results && Array.isArray(response.results)) {
                const errorResults = response.results.filter((result: any) => result.response?.error);
                
                if (errorResults.length > 0) {
                    // Format errors for better visualization
                    const errorSummary = `Topology configuration failed for ${errorResults.length} user(s):`;
                    const errorDetails = errorResults
                        .map((result: any) => `• ${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    const formattedError = `${errorSummary}\n\n${errorDetails}`;
                    showAlert(formattedError, 'error');
                    topologyDialogOpen = false;
                    return;
                }
            }
            
            showAlert('Topology configuration requested', 'success');
            // Refresh pool detail and health check to get updated topology
            await Promise.all([
                loadPoolDetail(),
                refreshHealthCheck()
            ]);
        } catch (error: any) {
            console.error('Failed to set topology:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to set topology';
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle new error format with errors array
                if (responseData.errors && Array.isArray(responseData.errors)) {
                    const errorSummary = `Topology configuration failed:`;
                    const errorDetails = responseData.errors
                        .map((errorMsg: string) => `• ${errorMsg}`)
                        .join('\n');
                    
                    errorMessage = `${errorSummary}\n\n${errorDetails}`;
                }
                // Handle structured error response with results array
                else if (responseData.results && Array.isArray(responseData.results)) {
                    const errorResults = responseData.results.filter((result: any) => result.response?.error);
                    
                    if (errorResults.length > 0) {
                        const errorSummary = `Topology configuration failed for ${errorResults.length} user(s):`;
                        const errorDetails = errorResults
                            .map((result: any) => `• ${result.userId}: ${result.response.error}`)
                            .join('\n');
                        
                        errorMessage = `${errorSummary}\n\n${errorDetails}`;
                    }
                } else if (responseData.error) {
                    // Handle simple error response
                    errorMessage = `Topology configuration error:\n\n${responseData.error}`;
                } else if (typeof responseData === 'string') {
                    // Handle plain text error
                    errorMessage = `Topology configuration error:\n\n${responseData}`;
                }
            } else if (error.message) {
                errorMessage = `Topology configuration error:\n\n${error.message}`;
            }
            
            showAlert(errorMessage, 'error');
        }
        topologyDialogOpen = false;
    }

    async function handleChangeTopology() {
        if (!selectedTopologyId) {
            showAlert('Please select a topology', 'error');
            return;
        }
        try {
            const response: any = await changePoolTopology(data.poolId, selectedTopologyId);
            
            // Check if response contains errors
            if (response?.results && Array.isArray(response.results)) {
                const errorResults = response.results.filter((result: any) => result.response?.error);
                
                if (errorResults.length > 0) {
                    // Format errors for better visualization
                    const errorSummary = `Topology change failed for ${errorResults.length} user(s):`;
                    const errorDetails = errorResults
                        .map((result: any) => `• ${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    const formattedError = `${errorSummary}\n\n${errorDetails}`;
                    showAlert(formattedError, 'error');
                    topologyDialogOpen = false;
                    selectedTopologyId = '';
                    return;
                }
            }
            
            showAlert(`Topology change to ${selectedTopologyId} requested`, 'success');
            // Refresh pool detail and health check to get updated topology
            await Promise.all([
                loadPoolDetail(),
                refreshHealthCheck()
            ]);
        } catch (error: any) {
            console.error('Failed to change topology:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to change topology';
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle structured error response with results array
                if (responseData.results && Array.isArray(responseData.results)) {
                    const errorResults = responseData.results.filter((result: any) => result.response?.error);
                    
                    if (errorResults.length > 0) {
                        const errorSummary = `Topology change failed for ${errorResults.length} user(s):`;
                        const errorDetails = errorResults
                            .map((result: any) => `• ${result.userId}: ${result.response.error}`)
                            .join('\n');
                        
                        errorMessage = `${errorSummary}\n\n${errorDetails}`;
                    }
                } else if (responseData.error) {
                    // Handle simple error response
                    errorMessage = `Topology change error:\n\n${responseData.error}`;
                } else if (typeof responseData === 'string') {
                    // Handle plain text error
                    errorMessage = `Topology change error:\n\n${responseData}`;
                }
            } else if (error.message) {
                errorMessage = `Topology change error:\n\n${error.message}`;
            }
            
            showAlert(errorMessage, 'error');
        }
        topologyDialogOpen = false;
        selectedTopologyId = '';
    }

    function showAlert(message: string, type: 'success' | 'error') {
        alertMessage = { message, type };
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function goBack() {
        goto('/pools');
    }

    function handleUserRowClick(user: any) {
        const userId = user.userId || user.user;
        goto(`/pool/${data.poolId}/logs/${userId}`);
    }

    function handleNote(user: any) {
        const userId = user.userId || user.user;
        goto(`/pool/${data.poolId}/user/${userId}`);
    }

    // Dialog action handlers
    function handleUsersClick() {
        usersDialogOpen = true;
    }

    function handleTopologyClick() {
        topologyDialogOpen = true;
        loadCurrentTopologyData();
    }

    async function loadCurrentTopologyData() {
        if (!poolDetail?.topologyId) return;
        
        isLoadingCurrentTopology = true;
        try {
            const topologyData = await getTopology(poolDetail.topologyId);
            currentTopologyData = {
                topologyId: topologyData.topologyId,
                topologyName: topologyData.topologyName,
                topologyFile: topologyData.topologyFile
            };
        } catch (error) {
            console.error('Error loading current topology data:', error);
            currentTopologyData = null;
        } finally {
            isLoadingCurrentTopology = false;
        }
    }

    async function handleDownloadCurrentTopology() {
        if (!poolDetail?.topologyId) {
            showAlert('No topology ID available to download', 'error');
            return;
        }

        try {
            await downloadTopologyFile(poolDetail.topologyId);
            showAlert('Topology file downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading topology:', error);
            showAlert('Failed to download topology file', 'error');
        }
    }

    function handleStatusClick() {
        statusDialogOpen = true;
    }

    function handleAccessClick() {
        accessDialogOpen = true;
    }

    // Sharing functions
    async function checkSharingStatus() {
        if (!poolDetail?.mainUser) return;
        
        sharingStatus.isLoading = true;
        try {
            const responseData = await checkSharingStatusAPI(data.poolId, poolDetail.mainUser);
            
            sharingStatus.shared = responseData.shared === true;
        } catch (error) {
            sharingStatus.shared = false;
        } finally {
            sharingStatus.isLoading = false;
        }
    }

    function handleSharingClick() {
        sharingDialogOpen = true;
    }

    async function handleSharePool() {
        if (!poolDetail?.mainUser) return;
        
        try {
            showAlert('Sending sharing request', 'success');
            await sharePool(data.poolId, poolDetail.mainUser);
            
            showAlert('Sharing request sent', 'success');
            // Refresh sharing status
            await checkSharingStatus();
        } catch (error: any) {
            console.error('Error sharing pool:', error);
            
            let errorMessage = 'Failed to share pool';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        sharingDialogOpen = false;
    }

    async function handleUnsharePool() {
        if (!poolDetail?.mainUser) return;
        
        try {
            showAlert('Sending unsharing request...', 'success');
            await unshareSharedPool(data.poolId, poolDetail.mainUser);
            
            // Check if unsharing was successful by verifying shared status
            showAlert('Verifying unshare status...', 'success');
            const checkData = await checkSharingStatusAPI(data.poolId, poolDetail.mainUser);
            
            if (checkData.shared === false) {
                showAlert('Pool unshared successfully', 'success');
                // Update our local status
                sharingStatus.shared = false;
            } else {
                showAlert('Unshare failed - pool is still shared', 'error');
                // Refresh to get actual status
                await checkSharingStatus();
            }
        } catch (error: any) {
            console.error('Error unsharing pool:', error);
            
            let errorMessage = 'Failed to unshare pool';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        sharingDialogOpen = false;
    }

    // Status dialog handlers
    async function handleDeployPool() {
        try {
            showAlert('Deploying pool', 'success');
            await deployPool(data.poolId);
            showAlert('Pool deployment requested', 'success');
            // Refresh status to update the deployment status
            await refreshHealthCheck();
        } catch (error: any) {
            console.error('Error deploying pool:', error);
            
            let errorMessage = 'Failed to deploy pool';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        statusDialogOpen = false;
    }

    async function handleRedeployPool() {
        try {
            showAlert('Redeploying pool', 'success');
            await redeployPool(data.poolId);
            showAlert('Pool redeployment requested', 'success');
            // Refresh status to update the deployment status
            await refreshHealthCheck();
        } catch (error: any) {
            console.error('Error redeploying pool:', error);
            
            let errorMessage = 'Failed to redeploy pool';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        statusDialogOpen = false;
    }

    async function handleAbortPool() {
        try {
            showAlert('Aborting pool operations', 'success');
            await abortPool(data.poolId);
            showAlert('Pool abort requested', 'success');
            // Refresh status to update the deployment status
            await refreshHealthCheck();
        } catch (error: any) {
            console.error('Error aborting pool operations:', error);
            
            let errorMessage = 'Failed to abort pool operations';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        statusDialogOpen = false;
    }

    async function handleDestroyPool() {
        try {
            showAlert('Destroying pool', 'success');
            await destroyPool(data.poolId);
            showAlert('Pool destruction requested', 'success');
            // Refresh status to update the deployment status
            await refreshHealthCheck();
        } catch (error: any) {
            console.error('Error removing pool:', error);
            
            let errorMessage = 'Failed to destroy pool';
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            }
            
            showAlert(errorMessage, 'error');
        }
        statusDialogOpen = false;
    }
    
    // Data processing - using $effect for runes mode
    let processedUserData: any[] = $state([]);
    let filteredHeaders: { key: string; label: string; sortable?: boolean }[] = $state([]);

    $effect(() => {
        if (poolDetail?.usersAndTeams) {
            // First, process all regular users
            let userData = poolDetail.usersAndTeams.map((user: any) => {
                // Find the status for this user from health check data
                const userStatus = healthCheck.status?.results?.find(result => result.userId === user.userId || result.userId === user.user);
                
                return {
                    ...user,
                    userType: user.userType || 'REGULAR',
                    status: userStatus?.state ? userStatus.state.toUpperCase() : 'UNKNOWN'
                };
            });

            // If pool is shared, add the main user to the processed data
            if (poolDetail.type === 'SHARED' && poolDetail.mainUser) {
                // Find the status for the main user from health check data
                const mainUserStatus = healthCheck.status?.results?.find(result => result.userId === poolDetail?.mainUser);
                
                const mainUserEntry = {
                    user: poolDetail.mainUser,
                    userId: poolDetail.mainUser,
                    userType: 'MAIN',
                    status: mainUserStatus?.state ? mainUserStatus.state.toUpperCase() : 'UNKNOWN',
                    team: 'N/A' // Main user does not belong to a team
                };
                
                // Add main user at the beginning of the array
                userData = [mainUserEntry, ...userData];
            }

            // Set the processed data once
            processedUserData = userData;

            const baseHeaders = [
                { key: 'user', label: 'User' },
                { key: 'userType', label: 'User Type' },
            ];
            
            // Only add team column if any user has a team
            const hasTeams = poolDetail.usersAndTeams.some((user: any) => user.team);
            if (hasTeams) {
                baseHeaders.push({ key: 'team', label: 'Team' });
            }
            
            baseHeaders.push({ key: 'status', label: 'Status' });
            
            filteredHeaders = baseHeaders;
        } else {
            processedUserData = [];
            filteredHeaders = [];
        }
    });

    const selectedTopology = $derived(
        topologyOptions.find((t) => t.value === selectedTopologyId)?.label
    );

    // Status indicator colors - using $derived for Svelte 5
    const getUsersStatusColor = $derived(() => {
        if (healthCheck.isLoading) return 'bg-gray-400';
        if (!healthCheck.users) return 'bg-gray-400';
        return healthCheck.users.allExist ? 'bg-green-500' : 'bg-red-500';
    });

    const getTopologyStatusColor = $derived(() => {
        if (healthCheck.isLoading) return 'bg-gray-400';
        if (!healthCheck.topology) return 'bg-gray-400';
        return healthCheck.topology.matchPoolTopology ? 'bg-green-500' : 'bg-red-500';
    });

    // Status dot based on allDeployed from health check
    const getStatusIndicatorColor = $derived(() => {
        if (healthCheck.isLoading) return 'bg-gray-400';
        if (!healthCheck.status) return 'bg-gray-400';
        return healthCheck.status.allDeployed ? 'bg-green-500' : 'bg-red-500';
    });

    // Access dot based on ctfdData from poolDetail
    const getAccessStatusColor = $derived(() => {
        if (!poolDetail) return 'bg-gray-400';
        return poolDetail.ctfdData ? 'bg-green-500' : 'bg-red-500';
    });
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Show loading state immediately -->
    {#if isInitialLoading}
        <div class="flex items-center justify-center h-full">
            <div class="text-center space-y-4">
                <div class="animate-spin h-8 w-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto"></div>
                <p class="text-muted-foreground">Loading pool {data.poolId}...</p>
            </div>
        </div>
    {:else if loadingError}
        <div class="flex items-center justify-center h-full">
            <div class="text-center space-y-4">
                <AlertCircle class="h-8 w-8 text-red-500 mx-auto" />
                <p class="text-red-500">{loadingError}</p>
                <Button onclick={loadPoolData} variant="outline">
                    <RefreshCw class="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        </div>
    {:else}
    <!-- Main content - only show when we have basic pool data -->
    
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-4">
            <Button variant="outline" onclick={goBack} class="flex items-center gap-2">
                <ArrowLeft class="h-4 w-4" />
                Back
            </Button>
            <div>
                <h1 class="text-3xl font-bold">Pool {data.poolId}</h1>
                {#if poolDetail}
                    <p class="text-sm text-muted-foreground">
                        {poolDetail.note} • {poolDetail.type} • Created by {poolDetail.createdBy} • {formatDate(poolDetail.createdAt)}
                    </p>
                {:else}
                    <div class="flex space-x-2 mt-1">
                        <Skeleton class="h-4 w-32" />
                        <Skeleton class="h-4 w-24" />
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Status Navigation Tabs -->
    <div class="mb-6 flex items-center gap-2 flex-shrink-0">
        <div class="flex rounded-lg bg-gray-100 dark:bg-zinc-900 p-1 gap-1">
            <Button variant="outline" onclick={handleUsersClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">users</span>
                <div class="w-3 h-3 rounded-full {healthCheck.users?.allExist === true ? 'bg-green-500' : healthCheck.users?.allExist === false ? 'bg-red-500' : 'bg-gray-400'}"></div>
            </Button>
            <Button variant="outline" onclick={handleTopologyClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">topology</span>
                <div class="w-3 h-3 rounded-full {healthCheck.topology?.matchPoolTopology === true ? 'bg-green-500' : healthCheck.topology?.matchPoolTopology === false ? 'bg-red-500' : 'bg-gray-400'}"></div>
            </Button>
            <Button variant="outline" onclick={handleStatusClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">status</span>
                <div class="w-3 h-3 rounded-full {healthCheck.status?.allDeployed === true ? 'bg-green-500' : healthCheck.status?.allDeployed === false ? 'bg-red-500' : 'bg-gray-400'}"></div>
            </Button>
            {#if poolDetail?.type === 'SHARED'}
                <Button variant="outline" onclick={handleSharingClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                    <span class="text-base font-medium">sharing</span>
                    <div class="w-3 h-3 rounded-full {sharingStatus.isLoading ? 'bg-gray-400' : sharingStatus.shared ? 'bg-green-500' : 'bg-red-500'}"></div>
                </Button>
            {/if}
            <Button variant="outline" onclick={handleAccessClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">access</span>
                <div class="w-3 h-3 rounded-full {poolDetail?.ctfdData === true ? 'bg-green-500' : poolDetail?.ctfdData === false ? 'bg-red-500' : 'bg-gray-400'}"></div>
            </Button>
        </div>
        
        <!-- Refresh Button with more spacing -->
        <Button 
            variant="outline" 
            onclick={handleRefresh} 
            disabled={isRefreshing}
            class="flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm ml-4"
        >
            <RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
            <span>refresh</span>
        </Button>
    </div>

        <!-- Floating Alert Messages -->
    {#if alertMessage}
        <div class="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl animate-in slide-in-from-top-2">
            <Alert.Root variant={alertMessage.type === 'error' ? 'destructive' : 'default'} class="shadow-lg border">
                {#if alertMessage.type === 'error'}
                    <AlertCircle class="h-4 w-4" />
                {:else}
                    <CheckCircle2 class="h-4 w-4" />
                {/if}
                <Alert.Title class="text-sm font-medium">
                    {alertMessage.type === 'error' ? 'Error' : 'Success'}
                </Alert.Title>
                <Alert.Description class="text-sm flex items-start justify-between pr-2">
                    <pre class="whitespace-pre-wrap text-wrap break-words text-sm max-w-full">{alertMessage.message}</pre>
                    <Button variant="ghost" size="sm" onclick={hideAlert} class="h-6 w-6 p-0 ml-2 flex-shrink-0">
                        <X class="h-3 w-3" />
                    </Button>
                </Alert.Description>
            </Alert.Root>
        </div>
    {/if}

    <!-- Users Table -->
    <div class="flex-1 min-h-0 w-full overflow-hidden pb-4">
        {#if poolDetail?.usersAndTeams}
            <DataTable 
                data={processedUserData} 
                headers={filteredHeaders}
                maxHeight="calc(100% - 2rem)"
                onRowClick={handleUserRowClick}
                showActions={true}
                onNote={handleNote}
            />
        {:else}
            <div class="flex items-center justify-center h-32">
                <p class="text-muted-foreground">Loading users...</p>
            </div>
        {/if}
    </div>

    <!-- Users Dialog -->
    <Dialog.Root bind:open={usersDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Users class="h-5 w-5" />
                    Manage Users
                </Dialog.Title>
                <Dialog.Description>
                    Import missing users into Ludus or patch existing users in the pool definition.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-6">
                <!-- Action Type Selection -->
                <div class="space-y-3">
                    <div class="text-sm font-medium">Action Type</div>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {userActionType === 'import' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={userActionType} value="import" class="text-primary" />
                            <span class="text-sm font-medium">Import</span>
                        </label>
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {userActionType === 'patch' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={userActionType} value="patch" class="text-primary" />
                            <span class="text-sm font-medium">Patch</span>
                        </label>
                    </div>
                </div>

                <!-- Content Area with Fixed Height -->
                <div class="min-h-[16rem]">
                {#if userActionType === 'import'}
                    <!-- Import Missing Users -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Missing Users</div>
                            <div class="h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                                {#each missingUsers as user}
                                    <div class="flex items-center justify-between p-2 border rounded-lg">
                                        <span class="text-sm">{user}</span>
                                        <span class="text-xs text-muted-foreground">Missing</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                {:else if userActionType === 'patch'}
                    <!-- Patch Users -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Users and Teams</div>
                            <p class="text-xs text-muted-foreground">
                                Enter one per line "Username, Team" or "Username"
                            </p>
                            <textarea
                                bind:value={patchUserInput}
                                placeholder="Alice Dan, smurfs
Bob Dylan, gargamel
Dave Smith, smurfs"
                                class="w-full h-48 px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                            ></textarea>
                            {#if patchUserInput.trim()}
                                <p class="text-xs text-muted-foreground">
                                    {parseBulkUsers(patchUserInput).length} user(s) parsed
                                </p>
                            {/if}
                        </div>
                    </div>
                {/if}
                </div>
            </div>

            <Dialog.Footer class="flex justify-end gap-2">
                {#if userActionType === 'patch'}
                    <Button 
                        onclick={handleCheckPatchUsers}
                        variant="outline"
                        disabled={!patchUserInput.trim()}
                        class="flex items-center gap-2"
                    >
                        <Search class="h-4 w-4" />
                        Check Users in Pools
                    </Button>
                    <div class="flex-1"></div>
                {/if}
                <Button variant="outline" onclick={() => usersDialogOpen = false}>
                    Cancel
                </Button>
                {#if userActionType === 'import'}
                    <Button onclick={handleImportUsers} disabled={missingUsers.length === 0}>
                        Import {missingUsers.length} Users
                    </Button>
                {:else if userActionType === 'patch'}
                    <Button onclick={handlePatchUsers} disabled={!patchUserInput.trim()}>
                        Patch Users
                    </Button>
                {/if}
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Topology Dialog -->
    <Dialog.Root bind:open={topologyDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Map class="h-5 w-5" />
                    Manage Topology
                </Dialog.Title>
                <Dialog.Description>
                    Set topology in Ludus or change topology inside pool definition.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-6">
                <!-- Action Type Selection -->
                <div class="space-y-3">
                    <div class="text-sm font-medium">Action Type</div>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {topologyActionType === 'set' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={topologyActionType} value="set" class="text-primary" />
                            <span class="text-sm font-medium">Set</span>
                        </label>
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {topologyActionType === 'change' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={topologyActionType} value="change" class="text-primary" />
                            <span class="text-sm font-medium">Change</span>
                        </label>
                    </div>
                </div>

                <!-- Content Area with Fixed Height -->
                <div class="min-h-[5rem]">
                {#if topologyActionType === 'set'}
                    <!-- Set Topology -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Current Topology</div>
                            <div class="w-full px-3 py-2 border border-input bg-muted/50 text-sm rounded-md flex items-center justify-between">
                                <span class="font-medium">
                                    {#if isLoadingCurrentTopology}
                                        <Skeleton class="h-4 w-32 inline-block" />
                                    {:else if currentTopologyData}
                                        {currentTopologyData.topologyName} (ID {currentTopologyData.topologyId})
                                    {:else}
                                        {poolDetail?.topologyId || 'Loading...'}
                                    {/if}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onclick={handleDownloadCurrentTopology}
                                    class="h-6 px-2 text-xs"
                                    disabled={!currentTopologyData?.topologyFile || isLoadingCurrentTopology}
                                >
                                    <Download class="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                {:else if topologyActionType === 'change'}
                    <!-- Change Topology -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Select New Topology</div>
                            <Popover.Root bind:open={topologyComboboxOpen}>
                                <Popover.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            {...props}
                                            variant="outline"
                                            class="w-full justify-between"
                                            role="combobox"
                                            aria-expanded={topologyComboboxOpen}
                                        >
                                            {topologyOptions.find(t => t.value === selectedTopologyId)?.label || "Select topology..."}
                                            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    {/snippet}
                                </Popover.Trigger>
                                <Popover.Content class="w-full p-0">
                                    <Command.Root>
                                        <Command.Input placeholder="Search topologies..." />
                                        <Command.List>
                                            <Command.Empty>No topology found.</Command.Empty>
                                            <Command.Group>
                                                {#each topologyOptions as topology (topology.value)}
                                                    <Command.Item
                                                        value={topology.label}
                                                        onSelect={() => {
                                                            selectedTopologyId = topology.value;
                                                            topologyComboboxOpen = false;
                                                        }}
                                                    >
                                                        <Check
                                                            class="mr-2 h-4 w-4 {selectedTopologyId !== topology.value && 'text-transparent'}"
                                                        />
                                                        <div class="flex flex-col">
                                                            <span>{topology.label}</span>
                                                            <span class="text-xs text-muted-foreground">{topology.description}</span>
                                                        </div>
                                                    </Command.Item>
                                                {/each}
                                            </Command.Group>
                                        </Command.List>
                                    </Command.Root>
                                </Popover.Content>
                            </Popover.Root>
                        </div>
                    </div>
                {/if}
                </div>
            </div>

            <Dialog.Footer class="flex justify-end gap-2">
                <Button variant="outline" onclick={() => topologyDialogOpen = false}>
                    Cancel
                </Button>
                {#if topologyActionType === 'set'}
                    <Button onclick={handleSetTopology}>
                        Set Topology
                    </Button>
                {:else if topologyActionType === 'change'}
                    <Button onclick={handleChangeTopology} disabled={!selectedTopologyId}>
                        Change Topology
                    </Button>
                {/if}
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Status Dialog -->
    <Dialog.Root bind:open={statusDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Network class="h-5 w-5" />
                    Manage Status
                </Dialog.Title>
                <Dialog.Description>
                    Deploy, redeploy, abort, or destroy the pool.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-6">
                <!-- Action Type Selection -->
                <div class="space-y-3">
                    <div class="text-sm font-medium">Action Type</div>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {statusActionType === 'deploy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={statusActionType} value="deploy" class="text-primary" />
                            <span class="text-sm font-medium">Deploy</span>
                        </label>
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {statusActionType === 'redeploy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={statusActionType} value="redeploy" class="text-primary" />
                            <span class="text-sm font-medium">Redeploy</span>
                        </label>
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {statusActionType === 'abort' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={statusActionType} value="abort" class="text-primary" />
                            <span class="text-sm font-medium">Abort</span>
                        </label>
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {statusActionType === 'destroy' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={statusActionType} value="destroy" class="text-primary" />
                            <span class="text-sm font-medium">Destroy</span>
                        </label>
                    </div>
                </div>

                <!-- Content Area with Fixed Height -->
                <div class="min-h-[80px]">
                {#if statusActionType === 'deploy'}
                    <!-- Deploy -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Deploy Pool</div>
                            <div class="w-full px-3 py-2 border border-input bg-muted/50 text-sm rounded-md">
                                <span class="text-muted-foreground">Start deploying the pool infrastructure</span>
                            </div>
                        </div>
                    </div>
                {:else if statusActionType === 'redeploy'}
                    <!-- Redeploy -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Redeploy Pool</div>
                            <div class="w-full px-3 py-2 border border-input bg-muted/50 text-sm rounded-md">
                                <span class="text-muted-foreground">Redeploy the pool after deployment failure</span>
                            </div>
                        </div>
                    </div>
                {:else if statusActionType === 'abort'}
                    <!-- Abort -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Abort Operations</div>
                            <div class="w-full px-3 py-2 border border-input bg-red-50 text-sm rounded-md">
                                <span class="text-red-600 font-medium">⚠️ Stop all running operations</span>
                            </div>
                        </div>
                    </div>
                {:else if statusActionType === 'destroy'}
                    <!-- Destroy -->
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Destroy Pool</div>
                            <div class="w-full px-3 py-2 border border-input bg-red-50 text-sm rounded-md">
                                <span class="text-red-600 font-medium">⚠️ Permanently destroy all pool resources</span>
                            </div>
                        </div>
                    </div>
                {/if}
                </div>
            </div>

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => statusDialogOpen = false}>Cancel</Button>
                {#if statusActionType === 'deploy'}
                    <Button onclick={handleDeployPool} class="bg-primary text-primary-foreground hover:bg-primary/90">
                        Deploy
                    </Button>
                {:else if statusActionType === 'redeploy'}
                    <Button onclick={handleRedeployPool} class="bg-primary text-primary-foreground hover:bg-primary/90">
                        Redeploy
                    </Button>
                {:else if statusActionType === 'abort'}
                    <Button onclick={handleAbortPool} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Abort
                    </Button>
                {:else if statusActionType === 'destroy'}
                    <Button onclick={handleDestroyPool} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Destroy
                    </Button>
                {/if}
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Access Dialog -->
    <Dialog.Root bind:open={accessDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Hand class="h-5 w-5" />
                    Manage Access
                </Dialog.Title>
                <Dialog.Description>
                    Create CTFd data for pool, download CTFd users logins, or download users WireGuard configurations.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-4">
                <Button 
                    onclick={handleFetchCtfdData}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                    disabled={!(healthCheck.users?.allExist && healthCheck.topology?.matchPoolTopology && healthCheck.status?.allDeployed)}
                >
                    <Flag class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Fetch CTFd Data to Pool</span>
                        <span class="text-xs text-muted-foreground">
                            {healthCheck.users?.allExist && healthCheck.topology?.matchPoolTopology && healthCheck.status?.allDeployed 
                                ? 'Available' 
                                : 'Requires users, topology and status processes to be finished successfully'}
                        </span>
                    </div>
                </Button>

                <Button 
                    onclick={handleDownloadCtfdLogins}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                    disabled={!poolDetail?.ctfdData}
                >
                    <FileText class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Download CTFd Logins</span>
                        <span class="text-xs text-muted-foreground">
                            {poolDetail?.ctfdData ? 'Available' : 'Requires CTFd data to be fetched first'}
                        </span>
                    </div>
                </Button>

                <Button 
                    onclick={handleDownloadWireguard}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                >
                    <GlobeLock class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Download Wireguard</span>
                        <span class="text-xs text-muted-foreground">Available</span>
                    </div>
                </Button>
            </div>

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => accessDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Sharing Dialog -->
    <Dialog.Root bind:open={sharingDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Share2 class="h-5 w-5" />
                    Manage Sharing
                </Dialog.Title>
                <Dialog.Description>
                    Share or unshare the main user's range.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-4">
                <Button 
                    onclick={handleSharePool}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                >
                    <Share2 class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Share</span>
                        <span class="text-xs text-muted-foreground">Share main user's range to the rest of the pool users</span>
                    </div>
                </Button>

                <Button 
                    onclick={handleUnsharePool}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                >
                    <X class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Unshare</span>
                        <span class="text-xs text-muted-foreground">Unhare main user's range to the rest of the pool users</span>
                    </div>
                </Button>
            </div>

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => sharingDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
    {/if}
</div>
