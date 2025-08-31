<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Alert from '$lib/components/ui/alert';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import LogViewer from '$lib/components/ui/log-viewer.svelte';
    import { 
        RefreshCw, 
        AlertCircle, 
        CheckCircle2, 
        X,
        Download,
        Users,
        Network,
        Check,
        ChevronsUpDown,
        Map,
        FileText
    } from 'lucide-svelte';
    import type { PoolDetail, PoolUser, PoolDetailData, PoolHealthCheck } from './data.js';
    import { 
        getPoolDetail, 
        refreshPoolData, 
        downloadUserLogs, 
        downloadUserWireguard,
        checkPoolHealth,
        importMissingUsers,
        setPoolTopology,
        changePoolTopology,
        getTopologies,
        fetchCtfdData,
        downloadCtfdLogins,
        downloadWireguardConfigs,
        deployPool,
        redeployPool,
        abortPool,
        destroyPool,
        fetchUserLogs
    } from './data.js';
    import { downloadTopologyFile } from '$lib/api/pools.client.js';
    import { getTopology } from '$lib/api/topology.client.js';
    import type { PageData } from './$types';

    // Cleanup streaming when component is destroyed
    $effect(() => {
        return () => {
            if (streamingInterval) {
                clearInterval(streamingInterval);
            }
        };
    });

    let { data }: { data: PageData } = $props();
    let poolDetail: PoolDetail | null = $state(null);
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
    
    // Dialog state
    let usersDialogOpen = $state(false);
    let topologyDialogOpen = $state(false);
    let statusDialogOpen = $state(false);
    let accessDialogOpen = $state(false);
    let logViewerOpen = $state(false);
    let selectedUserId = $state<string | null>(null);
    let userActionType: 'import' | 'patch' = $state('import');
    let topologyActionType: 'set' | 'download' | 'change' = $state('set');
    let statusActionType: 'deploy' | 'redeploy' | 'abort' | 'destroy' = $state('deploy');
    let accessActionType: 'ctfd' | 'logins' | 'wireguard' = $state('ctfd');
    let missingUsers = $derived(healthCheck.users?.missingUserIds || []); // Use actual data from health check
    let patchUserInput = $state('');
    let selectedTopologyId = $state('');
    let topologyComboboxOpen = $state(false);
    let topologyOptions = $state<any[]>([]);
    let currentTopologyData = $state<{topologyId: string; topologyName: string; topologyFile?: string} | null>(null);
    let isLoadingCurrentTopology = $state(false);
    
    // Log viewer state
    let logContent = $state<string>('');
    let logCursor = $state(0);
    let isLoadingLogs = $state(false);
    let logError = $state<string | null>(null);
    let isStreaming = $state(false);
    let streamingInterval: ReturnType<typeof setInterval> | null = $state(null);
    let playbookCompleted = $derived(logContent.includes('PLAY RECAP *********************************************************************'));
    
    // Load topologies on mount
    onMount(async () => {
        await loadPoolData();
        try {
            const rawTopologies = await getTopologies();
            // Map the raw topology data to the expected format
            topologyOptions = rawTopologies.map((topology: any) => ({
                value: topology.topologyId,
                label: topology.topologyName,
                description: `ID: ${topology.topologyId}`
            }));
        } catch (error) {
            console.error('Failed to load topologies:', error);
            // Fallback to sample data
            topologyOptions = [
                { value: 'topo1', label: 'Basic Network', description: 'ID: topo1' },
                { value: 'topo2', label: 'Advanced Lab', description: 'ID: topo2' },
                { value: 'topo3', label: 'Security Test', description: 'ID: topo3' }
            ];
        }
    });

    async function loadPoolData() {
        try {
            console.log('🔄 Loading pool data for:', data.poolId);
            
            // Load pool detail first - this is critical
            try {
                poolDetail = await getPoolDetail(data.poolId);
                console.log('📊 Pool detail loaded:', poolDetail);
            } catch (error) {
                console.error('❌ Error loading pool detail:', error);
                showAlert('Failed to load pool detail - check if dulus API is running', 'error');
                return;
            }
            
            // Load pool data - less critical
            try {
                poolData = await refreshPoolData(data.poolId);
                console.log('🔄 Pool data refreshed:', poolData);
            } catch (error) {
                console.error('❌ Error refreshing pool data:', error);
                console.log('⚠️ Continuing without pool data refresh...');
            }
            
            // Load health checks - least critical, should not block UI
            try {
                healthCheck.isLoading = true;
                healthCheck = await checkPoolHealth(data.poolId);
                console.log('🔍 Health check completed:', healthCheck);
            } catch (error) {
                console.error('❌ Error checking pool health:', error);
                console.log('⚠️ Health checks unavailable, using defaults...');
                healthCheck = {
                    users: null,
                    topology: null,
                    status: null,
                    isLoading: false
                };
            }
        } catch (error) {
            console.error('❌ Critical error loading pool data:', error);
            showAlert('Critical error loading pool data', 'error');
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
            console.log('📊 Pool detail refreshed:', poolDetail);
        } catch (error) {
            console.error('❌ Error loading pool detail:', error);
            throw error;
        }
    }

    async function refreshHealthCheck() {
        try {
            healthCheck = { ...healthCheck, isLoading: true };
            healthCheck = await checkPoolHealth(data.poolId);
            console.log('🏥 Health check refreshed:', healthCheck);
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
            await downloadCtfdLogins(data.poolId);
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
                    usersDialogOpen = false;
                    return;
                }
            }
            
            showAlert(`Import of ${missingUsers.length} users requested`, 'success');
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
        usersDialogOpen = false;
    }

    function handlePatchUsers() {
        const users = parseBulkUsers(patchUserInput);
        showAlert(`Patching ${users.length} users`, 'success');
        usersDialogOpen = false;
        patchUserInput = '';
        // TODO: Implement actual patch
    }

    // Parse bulk user input from create page
    function parseBulkUsers(input: string) {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: Array<{user: string; team?: string}> = [];
        
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

    // Topology dialog handlers
    async function handleDownloadTopology() {
        if (!selectedTopologyId) {
            showAlert('Please select a topology to download', 'error');
            return;
        }
        
        try {
            showAlert('Downloading topology...', 'success');
            await downloadTopologyFile(selectedTopologyId);
            showAlert('Topology downloaded successfully', 'success');
        } catch (error) {
            console.error('Error downloading topology:', error);
            showAlert('Failed to download topology', 'error');
        } finally {
            topologyDialogOpen = false;
            selectedTopologyId = '';
        }
    }

    async function handleSetTopology() {
        try {
            const response: any = await setPoolTopology(data.poolId);
            
            // Check if response contains errors
            if (response?.results && Array.isArray(response.results)) {
                const errors = response.results
                    .filter((result: any) => result.response?.error)
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (errors) {
                    showAlert(`Configuration errors:\n${errors}`, 'error');
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
                
                // Handle structured error response with results array
                if (responseData.results && Array.isArray(responseData.results)) {
                    const errors = responseData.results
                        .filter((result: any) => result.response?.error)
                        .map((result: any) => `${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    if (errors) {
                        errorMessage = `Configuration errors:\n${errors}`;
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
                const errors = response.results
                    .filter((result: any) => result.response?.error)
                    .map((result: any) => `${result.userId}: ${result.response.error}`)
                    .join('\n');
                
                if (errors) {
                    showAlert(`Configuration errors:\n${errors}`, 'error');
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
                    const errors = responseData.results
                        .filter((result: any) => result.response?.error)
                        .map((result: any) => `${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    if (errors) {
                        errorMessage = `Configuration errors:\n${errors}`;
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

    function getStatusPointColor(value: boolean | null): string {
        if (value === null) return 'bg-gray-400';
        return value ? 'bg-green-500' : 'bg-red-500';
    }



    async function handleUserLogs(user: PoolUser) {
        try {
            await downloadUserLogs(data.poolId, user.userId);
            showAlert(`Logs for ${user.user} downloaded successfully`, 'success');
        } catch (error) {
            console.error('Error downloading user logs:', error);
            showAlert(`Failed to download logs for ${user.user}`, 'error');
        }
    }

    async function handleUserWireguard(user: PoolUser) {
        try {
            await downloadUserWireguard(data.poolId, user.userId);
            showAlert(`Wireguard config for ${user.user} downloaded successfully`, 'success');
        } catch (error) {
            console.error('Error downloading Wireguard config:', error);
            showAlert(`Failed to download Wireguard config for ${user.user}`, 'error');
        }
    }

    function handleUserRowClick(user: any) {
        const userId = user.userId || user.user;
        goto(`/pool/${data.poolId}?userid=${userId}`);
    }

    function closeLogViewer() {
        goto(`/pool/${data.poolId}`);
    }

    // Log management functions
    async function loadUserLogs(userId: string, initialTail: number = 1000) {
        if (!userId) return;
        
        isLoadingLogs = true;
        logError = null;
        
        try {
            // First, try to get as many logs as possible
            const response = await fetchUserLogs(userId, initialTail, 0);
            logContent = response.result;
            logCursor = response.cursor;
            
            // Check if the playbook has already completed
            if (response.result && response.result.includes('PLAY RECAP *********************************************************************')) {
                console.log('🏁 Detected PLAY RECAP in initial load - playbook already completed');
                // Don't start streaming if already completed
                return;
            }
            
            // Start continuous streaming if logs were loaded successfully and playbook not completed
            if (response.result) {
                startLogStreaming(userId);
            }
        } catch (error: any) {
            console.error('Error loading user logs:', error);
            logError = error.message || 'Failed to load logs';
            logContent = '';
        } finally {
            isLoadingLogs = false;
        }
    }

    function startLogStreaming(userId: string) {
        if (streamingInterval) {
            clearInterval(streamingInterval);
        }
        
        isStreaming = true;
        
        // Fetch new logs every 3 seconds
        streamingInterval = setInterval(async () => {
            try {
                const response = await fetchUserLogs(userId, 100, logCursor);
                
                // Only append if there's new content
                if (response.result && response.result.trim()) {
                    logContent += response.result;
                    logCursor = response.cursor;
                    
                    // Check if we've reached the end of the playbook (PLAY RECAP indicates completion)
                    if (response.result.includes('PLAY RECAP *********************************************************************')) {
                        console.log('🏁 Detected PLAY RECAP - stopping log streaming');
                        stopLogStreaming();
                        showAlert('Playbook completed - log streaming stopped', 'success');
                    }
                }
            } catch (error: any) {
                console.error('Error streaming logs:', error);
                // Don't stop streaming on error, just log it
            }
        }, 3000);
    }

    function stopLogStreaming() {
        if (streamingInterval) {
            clearInterval(streamingInterval);
            streamingInterval = null;
        }
        isStreaming = false;
    }

    async function refreshLogs() {
        if (!selectedUserId) return;
        
        // Stop current streaming
        stopLogStreaming();
        
        // Reset and reload logs
        logContent = '';
        logCursor = 0;
        await loadUserLogs(selectedUserId);
    }

    async function loadMoreLogs() {
        if (!selectedUserId || isLoadingLogs) return;
        
        // Temporarily stop streaming to avoid conflicts
        const wasStreaming = isStreaming;
        if (wasStreaming) {
            stopLogStreaming();
        }
        
        isLoadingLogs = true;
        
        try {
            const response = await fetchUserLogs(selectedUserId, 500, logCursor);
            logContent += response.result;
            logCursor = response.cursor;
            
            // Resume streaming if it was active
            if (wasStreaming && selectedUserId) {
                startLogStreaming(selectedUserId);
            }
        } catch (error: any) {
            console.error('Error loading more logs:', error);
            showAlert('Failed to load more logs', 'error');
            
            // Resume streaming even on error if it was active
            if (wasStreaming && selectedUserId) {
                startLogStreaming(selectedUserId);
            }
        } finally {
            isLoadingLogs = false;
        }
    }

    // Download logs for the current user
    async function downloadCurrentUserLogs() {
        if (!selectedUserId) return;
        
        try {
            await downloadUserLogs(data.poolId, selectedUserId);
            showAlert(`Logs for ${displayUserName} downloaded successfully`, 'success');
        } catch (error) {
            console.error('Error downloading user logs:', error);
            showAlert(`Failed to download logs for ${displayUserName}`, 'error');
        }
    }

    // Check URL params for userid
    $effect(() => {
        if ($page.url.searchParams.has('userid')) {
            selectedUserId = $page.url.searchParams.get('userid');
            logViewerOpen = true;
            // Load logs when user is selected
            if (selectedUserId) {
                loadUserLogs(selectedUserId);
            }
        } else {
            selectedUserId = null;
            logViewerOpen = false;
            // Stop streaming and clear logs when closing log viewer
            stopLogStreaming();
            logContent = '';
            logError = null;
            logCursor = 0;
        }
    });

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

    function handleDownloadCurrentTopology() {
        if (!currentTopologyData?.topologyFile) {
            showAlert('No topology data available to download', 'error');
            return;
        }

        try {
            const blob = new Blob([currentTopologyData.topologyFile], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentTopologyData.topologyName || currentTopologyData.topologyId}.yaml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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

    // Status dialog handlers
    async function handleDeployPool() {
        try {
            showAlert('Deploying pool...', 'success');
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
            showAlert('Redeploying pool...', 'success');
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
            showAlert('Aborting pool operations...', 'success');
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
            showAlert('Destroying pool...', 'success');
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

    function handleImportMissingUsers() {
        // TODO: Get missing users from API and show confirmation dialog
        const missingUsers = ['user1', 'user2']; // Example
        if (confirm(`Do you want to import missing users: ${missingUsers.join(', ')}?`)) {
            showAlert('Users imported successfully', 'success');
        }
        usersDialogOpen = false;
    }

    // Data processing - using $effect for runes mode
    let processedUserData: any[] = $state([]);
    let filteredHeaders: { key: string; label: string; sortable?: boolean }[] = $state([]);

    $effect(() => {
        if (poolDetail?.usersAndTeams) {
            processedUserData = poolDetail.usersAndTeams.map((user: any) => {
                // Find the status for this user from health check data
                const userStatus = healthCheck.status?.results?.find(result => result.userId === user.userId || result.userId === user.user);
                
                return {
                    ...user,
                    userType: user.userType || 'regular',
                    status: userStatus?.state ? userStatus.state.toUpperCase() : 'UNKNOWN'
                };
            });

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

    // Get the actual user name from the selectedUserId
    const selectedUserName = $derived(() => {
        if (!selectedUserId || !processedUserData.length) return selectedUserId;
        const user = processedUserData.find((u: any) => 
            (u.userId === selectedUserId) || (u.user === selectedUserId)
        );
        return user?.user || selectedUserId;
    });

    // Simple variable to hold the display name
    let displayUserName = $state('');
    
    $effect(() => {
        if (!selectedUserId || !processedUserData.length) {
            displayUserName = selectedUserId || '';
            return;
        }
        const user = processedUserData.find((u: any) => 
            (u.userId === selectedUserId) || (u.user === selectedUserId)
        );
        displayUserName = user?.user || selectedUserId || '';
    });

    // Status indicator colors - using $derived for Svelte 5
    const getUsersStatusColor = $derived(() => {
        console.log('getUsersStatusColor - healthCheck.users:', healthCheck.users);
        if (healthCheck.isLoading) return 'bg-gray-400';
        if (!healthCheck.users) return 'bg-gray-400';
        return healthCheck.users.allExist ? 'bg-green-500' : 'bg-red-500';
    });

    const getTopologyStatusColor = $derived(() => {
        console.log('getTopologyStatusColor - healthCheck.topology:', healthCheck.topology);
        if (healthCheck.isLoading) return 'bg-gray-400';
        if (!healthCheck.topology) return 'bg-gray-400';
        return healthCheck.topology.matchPoolTopology ? 'bg-green-500' : 'bg-red-500';
    });

    // Status dot based on allDeployed from health check
    const getStatusIndicatorColor = $derived(() => {
        console.log('getStatusIndicatorColor - healthCheck.status:', healthCheck.status);
        if (healthCheck.isLoading) return 'bg-gray-400';
        if (!healthCheck.status) return 'bg-gray-400';
        return healthCheck.status.allDeployed ? 'bg-green-500' : 'bg-red-500';
    });

    // Access dot based on ctfdData from poolDetail
    const getAccessStatusColor = $derived(() => {
        console.log('getAccessStatusColor - poolDetail.ctfdData:', poolDetail?.ctfdData);
        if (!poolDetail) return 'bg-gray-400';
        return poolDetail.ctfdData ? 'bg-green-500' : 'bg-red-500';
    });
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold">Pool {data.poolId}</h1>
                {#if poolDetail}
                    <p class="text-sm text-muted-foreground">
                        {#if poolDetail.note}
                            {poolDetail.note} • 
                        {/if}
                        {poolDetail.type} • Created by {poolDetail.createdBy}
                    </p>
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
                    <pre class="whitespace-pre-wrap text-wrap break-words text-sm font-mono max-w-full">{alertMessage.message}</pre>
                    <Button variant="ghost" size="sm" onclick={hideAlert} class="h-6 w-6 p-0 ml-2 flex-shrink-0">
                        <X class="h-3 w-3" />
                    </Button>
                </Alert.Description>
            </Alert.Root>
        </div>
    {/if}

    <!-- Users Table or Log Viewer -->
    <div class="flex-1 min-h-0 w-full overflow-hidden pb-4">
        {#if logViewerOpen && selectedUserId}
            <!-- Inline Log Viewer -->
            <div class="h-full flex flex-col border rounded-lg overflow-hidden">
                <!-- Log Header -->
                <div class="flex items-center justify-between px-6 py-3 border-b bg-gray-100 dark:bg-zinc-900 flex-shrink-0">
                    <div class="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onclick={closeLogViewer}
                            class="hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg px-3 py-2"
                        >
                            ←
                        </Button>
                        
                        <h3 class="text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                            {displayUserName} Logs
                        </h3>
                        
                        {#if playbookCompleted}
                            <div class="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                <CheckCircle2 class="h-3 w-3" />
                                Completed
                            </div>
                        {:else if isLoadingLogs}
                            <div class="text-xs text-muted-foreground flex items-center gap-2">
                                <RefreshCw class="h-3 w-3 animate-spin" />
                                Loading...
                            </div>
                        {:else if isStreaming}
                            <div class="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Streaming
                            </div>
                        {/if}
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onclick={() => {
                                if (isStreaming) {
                                    stopLogStreaming();
                                } else if (selectedUserId) {
                                    startLogStreaming(selectedUserId);
                                }
                            }}
                            class="h-8 px-3 rounded-lg text-xs border-gray-300 dark:border-zinc-700"
                            title={isStreaming ? "Stop streaming" : "Start streaming"}
                        >
                            {#if isStreaming}
                                <div class="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                Stop
                            {:else}
                                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Stream
                            {/if}
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onclick={refreshLogs}
                            disabled={isLoadingLogs}
                            class="h-8 px-3 rounded-lg text-xs border-gray-300 dark:border-zinc-700"
                            title="Refresh logs"
                        >
                            <RefreshCw class="h-3 w-3 {isLoadingLogs ? 'animate-spin' : ''}" />
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onclick={downloadCurrentUserLogs}
                            class="h-8 px-3 rounded-lg text-xs border-gray-300 dark:border-zinc-700"
                            title="Download logs"
                        >
                            <Download class="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                
                <!-- Log Content -->
                <div class="flex-1 bg-gray-900 dark:bg-black text-green-600 dark:text-green-400 font-mono text-sm overflow-hidden">
                    <div class="h-full w-full overflow-y-auto overflow-x-auto p-4">
                        {#if logError}
                            <div class="text-red-400 p-4 text-center">
                                <AlertCircle class="h-5 w-5 mx-auto mb-2" />
                                <div class="text-sm">Error loading logs</div>
                                <div class="text-xs mt-1 opacity-75">{logError}</div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onclick={refreshLogs}
                                    class="mt-3 text-xs"
                                >
                                    Retry
                                </Button>
                            </div>
                        {:else if !logContent && !isLoadingLogs}
                            <div class="text-gray-400 p-4 text-center">
                                <div class="text-sm">No logs available</div>
                                <div class="text-xs mt-1 opacity-75">Logs will appear here when available</div>
                            </div>
                        {:else}
                            <!-- Display actual log content -->
                            {#each logContent.split('\n') as line, index}
                                {#if line.trim()}
                                    <div class="leading-relaxed hover:bg-gray-800/30 dark:hover:bg-gray-900/50 px-2 py-1 rounded mb-1 whitespace-pre-wrap {line.includes('PLAY RECAP') ? 'bg-yellow-900/30 border-l-4 border-yellow-500' : ''}">
                                        {line}
                                    </div>
                                {/if}
                            {/each}
                            
                            {#if isLoadingLogs && !logContent}
                                <div class="text-gray-500 dark:text-gray-400 animate-pulse mt-2 px-2">
                                    ● Loading logs...
                                </div>
                            {:else if playbookCompleted}
                                <div class="text-yellow-500 dark:text-yellow-400 mt-2 px-2 flex items-center gap-2">
                                    <CheckCircle2 class="w-4 h-4" />
                                    Playbook completed
                                </div>
                            {:else if isStreaming}
                                <div class="text-green-500 dark:text-green-400 mt-2 px-2 flex items-center gap-2">
                                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Live streaming...
                                </div>
                            {:else if logContent}
                                <!-- Load more button when not streaming -->
                                <div class="mt-4 px-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onclick={loadMoreLogs}
                                        disabled={isLoadingLogs}
                                        class="text-xs"
                                    >
                                        {#if isLoadingLogs}
                                            <RefreshCw class="h-3 w-3 animate-spin mr-2" />
                                            Loading...
                                        {:else}
                                            Load More Logs
                                        {/if}
                                    </Button>
                                </div>
                            {/if}
                        {/if}
                    </div>
                </div>
            </div>
        {:else if poolDetail?.usersAndTeams}
            <DataTable 
                data={processedUserData} 
                headers={filteredHeaders}
                maxHeight="calc(100% - 2rem)"
                onRowClick={handleUserRowClick}
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
                    Choose what you want to do: import missing users or patch existing users.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-6">
                <!-- Action Type Selection -->
                <div class="space-y-3">
                    <div class="text-sm font-medium">Action Type</div>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {userActionType === 'import' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                            <input type="radio" bind:group={userActionType} value="import" class="text-primary" />
                            <span class="text-sm font-medium">Import Missing</span>
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
                                placeholder="Alice Dan, smurfs&#10;Bob Dylan, gargamel&#10;Dave Smith, smurfs"
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
                    Choose what you want to do: set topology for all users or change to a different one.
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
                                                        value={topology.value}
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
                                <span class="text-muted-foreground">Redeploy the pool with current configuration</span>
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
                    <Download class="h-5 w-5" />
                    Manage Access
                </Dialog.Title>
                <Dialog.Description>
                    Access CTFd data, download logins, or Wireguard configurations.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="space-y-4">
                <Button 
                    onclick={handleFetchCtfdData}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                    disabled={!(healthCheck.users?.allExist && healthCheck.topology?.matchPoolTopology && healthCheck.status?.allDeployed)}
                >
                    <FileText class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Fetch CTFd Data to Pool</span>
                        <span class="text-xs text-muted-foreground">
                            {healthCheck.users?.allExist && healthCheck.topology?.matchPoolTopology && healthCheck.status?.allDeployed 
                                ? 'Available' 
                                : 'Requires Users, Topology & Status to be green'}
                        </span>
                    </div>
                </Button>

                <Button 
                    onclick={handleDownloadCtfdLogins}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                    disabled={!poolDetail?.ctfdData}
                >
                    <Download class="h-4 w-4" />
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
                    <Download class="h-4 w-4" />
                    <div class="flex flex-col items-start">
                        <span>Download Wireguard</span>
                        <span class="text-xs text-muted-foreground">Always available</span>
                    </div>
                </Button>
            </div>

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => accessDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
