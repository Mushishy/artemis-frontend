<script lang="ts">
    import { goto } from '$app/navigation';
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Alert from '$lib/components/ui/alert';
    import { AlertCircle, CheckCircle2, X, ArrowLeft } from 'lucide-svelte';
    import type { PoolDetail, PoolDetailData, PoolHealthCheck, PatchUserRequest } from '$lib/api/types.js';
    import { getPoolDetail, refreshPoolData, checkPoolHealth, checkSharingStatus, getTestingStatus } from '$lib/api/client/pools.client.js';
    import { getTopologies, getTopology, downloadTopologyFile } from '$lib/api/client/topology.client.js';
    import { formatDate } from '$lib/utils/helper';
    import type { PageData } from './$types';
    import { PoolHandlers } from '$lib/utils/pool-handlers.js';
    
    // Import all dialog components
    import UsersDialog from '$lib/components/pool/UsersDialog.svelte';
    import TopologyDialog from '$lib/components/pool/TopologyDialog.svelte';
    import StatusDialog from '$lib/components/pool/StatusDialog.svelte';
    import AccessDialog from '$lib/components/pool/AccessDialog.svelte';
    import SharingDialog from '$lib/components/pool/SharingDialog.svelte';
    import TestingDialog from '$lib/components/pool/TestingDialog.svelte';
    import StatusTabs from '$lib/components/pool/StatusTabs.svelte';

    let { data }: { data: PageData } = $props();
    
    // State
    let poolDetail: PoolDetail = $state(data.poolDetail);
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
    let sharingStatus = $state<{ shared: boolean; isLoading: boolean }>({ shared: false, isLoading: false });
    let testingStatus = $state<{ allSame: boolean; testingEnabled: boolean; isLoading: boolean }>({ allSame: false, testingEnabled: false, isLoading: false });
    // Remove initial loading - always show UI immediately
    
    // Dialog states
    let usersDialogOpen = $state(false);
    let topologyDialogOpen = $state(false);
    let statusDialogOpen = $state(false);
    let sharingDialogOpen = $state(false);
    let accessDialogOpen = $state(false);
    let testingDialogOpen = $state(false);
    
    // Topology state
    let topologyOptions = $state<any[]>([]);
    let currentTopologyData = $state<{topologyId: string; topologyName: string; topologyFile?: string} | null>(null);
    let isLoadingCurrentTopology = $state(false);
    
    // Create handlers instance - use derived to update when poolDetail changes
    const handlers = $derived(new PoolHandlers(data.poolId, poolDetail?.type || 'INDIVIDUAL', showAlert));
    
    // Always load data in background without showing loading screens
    if (!data.poolDetail) {
        // No server data - load quietly in background
        loadPoolDataQuietly();
    } else {
        // We have server data - load additional data in background
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
        topologyOptions = [
            { value: 'topo1', label: 'Basic Network', description: 'ID: topo1' },
            { value: 'topo2', label: 'Advanced Lab', description: 'ID: topo2' },
            { value: 'topo3', label: 'Security Test', description: 'ID: topo3' }
        ];
    });
    
    async function loadAdditionalData() {
        // Set loading states to false immediately since we have server data
        healthCheck = { ...healthCheck, isLoading: false };
        poolData = { ...poolData, isLoading: false };
        
        // Load background data when we already have pool detail from server
        // Don't set loading states that would cause UI to flicker
        try {
            Promise.all([
                // Load pool data quietly in background
                refreshPoolData(data.poolId).then(result => {
                    poolData = result;
                }).catch(error => {
                    console.error('Error refreshing pool data:', error);
                }),
                
                // Load health checks quietly in background
                checkPoolHealth(data.poolId).then(result => {
                    healthCheck = result;
                }).catch(error => {
                    console.error('Error checking pool health:', error);
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
                    checkSharingStatusHandler().catch(error => {
                        console.error('Error checking sharing status:', error);
                    });
                }
                
                // Load testing status after other data
                checkTestingStatus().catch(error => {
                    console.error('Error checking testing status:', error);
                });
            });
        } catch (error) {
            console.error('Error loading additional data:', error);
        }
    }
    
    async function loadPoolDataQuietly() {
        try {
            // Load pool detail quietly
            try {
                const rawPoolDetail = await getPoolDetail(data.poolId);
                
                // Process poolDetail to extract unique mainUsers from usersAndTeams
                if (rawPoolDetail && rawPoolDetail.usersAndTeams) {
                    const uniqueMainUsers = [...new Set(
                        rawPoolDetail.usersAndTeams
                            .map((userTeam: any) => userTeam.mainUserId)
                            .filter((mainUserId: string) => mainUserId) // Filter out any null/undefined values
                    )];
                    
                    rawPoolDetail.mainUsers = uniqueMainUsers;
                }
                
                poolDetail = rawPoolDetail;
            } catch (error) {
                console.error('Error loading pool detail:', error);
                // Don't show error screen, just log it
                return;
            }
            
            // Load additional data in background
            Promise.all([
                refreshPoolData(data.poolId).then(result => {
                    poolData = result;
                }).catch(error => {
                    console.error('Error refreshing pool data:', error);
                }),
                
                checkPoolHealth(data.poolId).then(result => {
                    healthCheck = result;
                }).catch(error => {
                    console.error('Error checking pool health:', error);
                    healthCheck = {
                        users: null,
                        topology: null,
                        status: null,
                        isLoading: false
                    };
                })
            ]).finally(() => {
                if (poolDetail?.type === 'SHARED') {
                    checkSharingStatusHandler().catch(error => {
                        console.error('Error checking sharing status:', error);
                    });
                }
                
                // Load testing status after other data
                checkTestingStatus().catch(error => {
                    console.error('Error checking testing status:', error);
                });
            });
        } catch (error) {
            console.error('Critical error loading pool data:', error);
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
                await checkSharingStatusHandler();
            }

            // Also refresh testing status
            await checkTestingStatus();

            showAlert('Pool data refreshed successfully', 'success');
        } catch (error) {
            showAlert('Failed to refresh pool data', 'error');
        } finally {
            isRefreshing = false;
        }
    }

    async function loadPoolDetail() {
        try {
            const rawPoolDetail = await getPoolDetail(data.poolId);
            
            // Process poolDetail to extract unique mainUsers from usersAndTeams
            if (rawPoolDetail && rawPoolDetail.usersAndTeams) {
                const uniqueMainUsers = [...new Set(
                    rawPoolDetail.usersAndTeams
                        .map((userTeam: any) => userTeam.mainUserId)
                        .filter((mainUserId: string) => mainUserId) // Filter out any null/undefined values
                )];
                
                rawPoolDetail.mainUsers = uniqueMainUsers;
            }
            
            poolDetail = rawPoolDetail;
        } catch (error) {
            throw error;
        }
    }

    async function refreshHealthCheck() {
        try {
            healthCheck = { ...healthCheck, isLoading: true };
            healthCheck = await checkPoolHealth(data.poolId);
        } catch (error) {
            throw error;
        }
    }

    async function checkSharingStatusHandler() {
        if (!poolDetail?.mainUsers || poolDetail.mainUsers.length === 0) return;
        
        sharingStatus.isLoading = true;
        try {
            const responseData = await checkSharingStatus(data.poolId);
            
            sharingStatus.shared = responseData.shared === true;
        } catch (error) {
            sharingStatus.shared = false;
        } finally {
            sharingStatus.isLoading = false;
        }
    }

    async function checkTestingStatus() {
        testingStatus.isLoading = true;
        try {
            const responseData = await getTestingStatus(data.poolId);
            
            testingStatus.allSame = responseData.allSame;
            testingStatus.testingEnabled = responseData.testingEnabled;
        } catch (error) {
            testingStatus.allSame = false;
            testingStatus.testingEnabled = false;
        } finally {
            testingStatus.isLoading = false;
        }
    }

    function showAlert(message: string, type: 'success' | 'error') {
        alertMessage = { message, type };
        setTimeout(() => {
            alertMessage = null;
        }, 10000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function formatStatus(status: string | undefined): string {
        if (!status) return 'UNKNOWN';
        const upperStatus = status.toUpperCase();
        return upperStatus === 'NEVER DEPLOYED' ? 'UNDEPLOYED' : upperStatus;
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
            showAlert('Failed to download topology file', 'error');
        }
    }

    // Dialog handler functions - simplified since dialogs handle their own logic
    async function handleImportUsers() {
        await handlers.importUsers(missingUsers);
        await Promise.all([loadPoolDetail(), refreshHealthCheck()]);
    }

    async function handlePatchUsers(users: PatchUserRequest[]) {
        await handlers.patchUsers(users);
        await Promise.all([loadPoolDetail(), refreshHealthCheck()]);
    }

    async function handleCheckPatchUsers(users: PatchUserRequest[]) {
        await handlers.checkUsersInPools(users);
    }

    async function handleSetTopology() {
        await handlers.setTopology();
        await Promise.all([loadPoolDetail(), refreshHealthCheck()]);
    }

    async function handleChangeTopology(topologyId: string) {
        await handlers.changeTopology(topologyId);
        await Promise.all([loadPoolDetail(), refreshHealthCheck()]);
    }

    // Status dialog handlers
    async function handleDeployPool(concurrentRequests: number) {
        await handlers.deployPool(concurrentRequests);
        await refreshHealthCheck();
    }

    async function handleRedeployPool(concurrentRequests: number) {
        await handlers.redeployPool(concurrentRequests);
        await refreshHealthCheck();
    }

    async function handleAbortPool() {
        await handlers.abortPool();
        await refreshHealthCheck();
    }

    async function handleDestroyPool() {
        await handlers.destroyPool();
        await refreshHealthCheck();
    }

    // Access dialog handlers
    async function handleFetchCtfdData() {
        const canFetch = healthCheck.users?.allExist && 
                        healthCheck.topology?.matchPoolTopology && 
                        healthCheck.status?.allDeployed;
        
        if (!canFetch) {
            showAlert('CTFd data can only be fetched when Users, Topology, and Status are all green', 'error');
            return;
        }

        await handlers.fetchCtfdData();
        await loadPoolDetail();
    }

    async function handleDownloadCtfdLogins() {
        if (!poolDetail?.ctfdData) {
            showAlert('CTFd logins can only be downloaded when CTFd data is available (green access indicator)', 'error');
            return;
        }

        await handlers.downloadCtfdLogins();
    }

    async function handleDownloadWireguard() {
        await handlers.downloadWireguard();
    }

    // Sharing handlers
    async function handleSharePool() {
        if (!poolDetail?.mainUsers || poolDetail.mainUsers.length === 0) return;
        
        await handlers.sharePool();
        await checkSharingStatusHandler();
    }

    async function handleUnsharePool() {
        if (!poolDetail?.mainUsers || poolDetail.mainUsers.length === 0) return;
        
        const success = await handlers.unsharePool();
        if (!success) {
            await checkSharingStatusHandler();
        } else {
            sharingStatus.shared = false;
        }
    }

    // Testing handlers
    async function handleStartTesting() {
        const canStart = healthCheck.users?.allExist && 
                        healthCheck.topology?.matchPoolTopology && 
                        healthCheck.status?.allDeployed;
        
        if (!canStart) {
            showAlert('Testing can only be started when Users, Topology, and Status are all green', 'error');
            return;
        }

        await handlers.startTesting();
        await checkTestingStatus();
    }

    async function handleStopTesting() {
        const canStop = healthCheck.users?.allExist && 
                       healthCheck.topology?.matchPoolTopology && 
                       healthCheck.status?.allDeployed;
        
        if (!canStop) {
            showAlert('Testing can only be stopped when Users, Topology, and Status are all green', 'error');
            return;
        }

        await handlers.stopTesting();
        await checkTestingStatus();
    }

    // Data processing - using $effect for runes mode
    let processedUserData: any[] = $state([]);
    let filteredHeaders: { key: string; label: string; sortable?: boolean }[] = $state([]);
    let missingUsers = $derived(healthCheck.users?.missingUserIds || []);

    $effect(() => {
        if (poolDetail?.usersAndTeams) {
            if (poolDetail.type === 'SHARED') {
                // For SHARED pools: Show both main users and regular users, hide userId column
                let userData: any[] = [];
                
                // Add main users
                if (poolDetail.mainUsers && poolDetail.mainUsers.length > 0) {
                    const mainUserEntries = poolDetail.mainUsers.map((mainUserId: string) => {
                        const mainUserStatus = healthCheck.status?.results?.find(result => result.userId === mainUserId);
                        
                        return {
                            user: mainUserId,
                            userId: mainUserId, // Keep for internal use but won't be displayed
                            mainUserId: 'N/A', // Main users have N/A as mainUserId
                            userType: 'MAIN',
                            status: formatStatus(mainUserStatus?.state),
                            team: 'N/A'
                        };
                    });
                    userData = [...userData, ...mainUserEntries];
                }
                
                // Add regular users
                const regularUserEntries = poolDetail.usersAndTeams.map((user: any) => {
                    const userStatus = healthCheck.status?.results?.find(result => result.userId === user.userId || result.userId === user.user);
                    
                    return {
                        ...user,
                        userType: user.userType || 'REGULAR',
                        status: formatStatus(userStatus?.state)
                    };
                });
                userData = [...userData, ...regularUserEntries];

                processedUserData = userData;

                // Headers for SHARED pools (no userId column)
                const baseHeaders = [
                    { key: 'user', label: 'User' },
                    { key: 'mainUserId', label: 'Main User ID' },
                    { key: 'userType', label: 'User Type' },
                ];
                
                const hasTeams = userData.some((user: any) => user.team && user.team !== 'N/A');
                if (hasTeams) {
                    baseHeaders.push({ key: 'team', label: 'Team' });
                }
                
                baseHeaders.push({ key: 'status', label: 'Status' });
                filteredHeaders = baseHeaders;
                
            } else {
                // For non-SHARED pools: Show regular users, don't show main users
                let userData = poolDetail.usersAndTeams.map((user: any) => {
                    const userStatus = healthCheck.status?.results?.find(result => result.userId === user.userId || result.userId === user.user);
                    
                    return {
                        ...user,
                        userType: user.userType || 'REGULAR',
                        status: formatStatus(userStatus?.state)
                    };
                });

                processedUserData = userData;

                // Headers for non-SHARED pools (include userId column, exclude mainUserId column)
                const baseHeaders = [
                    { key: 'user', label: 'User' },
                    { key: 'userId', label: 'User ID' },
                    { key: 'userType', label: 'User Type' },
                ];
                
                const hasTeams = poolDetail.usersAndTeams.some((user: any) => user.team);
                if (hasTeams) {
                    baseHeaders.push({ key: 'team', label: 'Team' });
                }
                
                baseHeaders.push({ key: 'status', label: 'Status' });
                filteredHeaders = baseHeaders;
            }
        } else {
            processedUserData = [];
            filteredHeaders = [];
        }
    });
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-4">
            <Button variant="outline" onclick={goBack} class="flex items-center gap-2">
                <ArrowLeft class="h-4 w-4" />
                Back
            </Button>
            <div>
                <h1 class="text-3xl font-bold">{poolDetail.note}</h1>
                {#if poolDetail}
                    <p class="text-sm text-muted-foreground">
                        Id {data.poolId} • Type {poolDetail.type} • Created by {poolDetail.createdBy} • Created at {formatDate(poolDetail.createdAt)}
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
    <StatusTabs 
        {healthCheck}
        poolType={poolDetail?.type}
        ctfdData={poolDetail?.ctfdData}
        {sharingStatus}
        {testingStatus}
        {isRefreshing}
        onUsersClick={() => usersDialogOpen = true}
        onTopologyClick={() => { topologyDialogOpen = true; loadCurrentTopologyData(); }}
        onStatusClick={() => statusDialogOpen = true}
        onSharingClick={poolDetail?.type === 'SHARED' ? () => sharingDialogOpen = true : undefined}
        onAccessClick={() => accessDialogOpen = true}
        onTestingClick={() => testingDialogOpen = true}
        onRefresh={handleRefresh}
    />

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
                <p class="text-muted-foreground">No users available</p>
            </div>
        {/if}
    </div>

    <!-- All Dialog Components -->
    <UsersDialog
        bind:open={usersDialogOpen}
        poolId={data.poolId}
        poolType={poolDetail.type}
        {missingUsers}
        onImport={handleImportUsers}
        onPatch={handlePatchUsers}
        onCheckUsers={handleCheckPatchUsers}
        onClose={() => usersDialogOpen = false}
        onShowAlert={showAlert}
    />

    <TopologyDialog
        bind:open={topologyDialogOpen}
        {topologyOptions}
        {currentTopologyData}
        {isLoadingCurrentTopology}
        onSet={handleSetTopology}
        onChange={handleChangeTopology}
        onDownloadCurrent={handleDownloadCurrentTopology}
        onClose={() => topologyDialogOpen = false}
    />

    <StatusDialog
        bind:open={statusDialogOpen}
        onDeploy={handleDeployPool}
        onRedeploy={handleRedeployPool}
        onAbort={handleAbortPool}
        onDestroy={handleDestroyPool}
        onClose={() => statusDialogOpen = false}
    />

    <AccessDialog
        bind:open={accessDialogOpen}
        {healthCheck}
        ctfdData={poolDetail?.ctfdData}
        onFetchCtfdData={handleFetchCtfdData}
        onDownloadCtfdLogins={handleDownloadCtfdLogins}
        onDownloadWireguard={handleDownloadWireguard}
        onClose={() => accessDialogOpen = false}
    />

    <SharingDialog
        bind:open={sharingDialogOpen}
        onShare={handleSharePool}
        onUnshare={handleUnsharePool}
        onClose={() => sharingDialogOpen = false}
    />

    <TestingDialog
        bind:open={testingDialogOpen}
        {healthCheck}
        onStartTesting={handleStartTesting}
        onStopTesting={handleStopTesting}
        onClose={() => testingDialogOpen = false}
    />
</div>
