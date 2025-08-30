<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
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
    import type { PoolDetail, PoolUser, PoolDetailData } from './data.js';
    import { 
        getPoolDetail, 
        refreshPoolData, 
        downloadUserLogs, 
        downloadUserWireguard 
    } from './data.js';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let poolDetail: PoolDetail | null = $state(null);
    let poolData: PoolDetailData = $state({
        users: null,
        topology: null,
        status: null,
        flags: null,
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
    let missingUsers = $state(['alice123', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456', 'bob456']); // Mock data for now
    let patchUserInput = $state('');
    let selectedTopologyId = $state('');
    let topologyComboboxOpen = $state(false);
    
    // Sample topology data - replace with actual data from your API
    const topologyOptions = [
        { value: 'topo1', label: 'Basic Network', description: 'ID: topo1' },
        { value: 'topo2', label: 'Advanced Lab', description: 'ID: topo2' },
        { value: 'topo3', label: 'Security Test', description: 'ID: topo3' }
    ];

    // Table headers: user name | team (if available) | status | actions
    const userHeaders: { key: keyof PoolUser; label: string; sortable?: boolean }[] = [
        { key: 'user', label: 'User Name', sortable: true },
        { key: 'team', label: 'Team', sortable: true },
        { key: 'status', label: 'Status', sortable: false }
    ];

    // Add inspect action
    function handleInspectUser(user: PoolUser) {
        showAlert(`Inspecting ${user.user}`, 'success');
        // TODO: Implement inspect modal/dialog
    }

    onMount(async () => {
        await loadPoolData();
    });

    async function loadPoolData() {
        try {
            poolDetail = await getPoolDetail(data.poolId);
            poolData = await refreshPoolData(data.poolId);
        } catch (error) {
            console.error('Error loading pool data:', error);
            showAlert('Failed to load pool data', 'error');
        }
    }

    async function handleRefresh() {
        isRefreshing = true;
        try {
            poolData = { ...poolData, isLoading: true };
            poolData = await refreshPoolData(data.poolId);
            showAlert('Pool data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing pool data:', error);
            showAlert('Failed to refresh pool data', 'error');
        } finally {
            isRefreshing = false;
        }
    }

    // User dialog handlers
    function handleImportUsers() {
        showAlert(`Importing ${missingUsers.length} missing users`, 'success');
        usersDialogOpen = false;
        // TODO: Implement actual import
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
    function handleSetTopology() {
        if (!selectedTopologyId) {
            showAlert('Please select a topology', 'error');
            return;
        }
        showAlert(`Setting topology ${selectedTopologyId} for all users`, 'success');
        topologyDialogOpen = false;
        selectedTopologyId = '';
        // TODO: Implement actual topology set for all users
    }

    function handleDownloadTopology() {
        showAlert('Downloading topology...', 'success');
        topologyDialogOpen = false;
        // TODO: Implement actual download
    }

    function handleChangeTopology() {
        if (!selectedTopologyId) {
            showAlert('Please select a topology', 'error');
            return;
        }
        showAlert(`Changing topology to ${selectedTopologyId}`, 'success');
        topologyDialogOpen = false;
        selectedTopologyId = '';
        // TODO: Implement actual topology change
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

    // Check URL params for userid
    $effect(() => {
        if ($page.url.searchParams.has('userid')) {
            selectedUserId = $page.url.searchParams.get('userid');
            logViewerOpen = true;
        } else {
            selectedUserId = null;
            logViewerOpen = false;
        }
    });

    // Dialog action handlers
    function handleUsersClick() {
        usersDialogOpen = true;
    }

    function handleTopologyClick() {
        topologyDialogOpen = true;
    }

    function handleStatusClick() {
        statusDialogOpen = true;
    }

    function handleAccessClick() {
        accessDialogOpen = true;
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
            processedUserData = poolDetail.usersAndTeams.map((user: any) => ({
                ...user,
                userType: user.userType || 'regular',
                status: user.status || 'Unknown'
            }));

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
                <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.users)}"></div>
            </Button>
            <Button variant="outline" onclick={handleTopologyClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">topology</span>
                <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.topology)}"></div>
            </Button>
            <Button variant="outline" onclick={handleStatusClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">status</span>
                <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.status === 'Running')}"></div>
            </Button>
            <Button variant="outline" onclick={handleAccessClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">access</span>
                <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.flags)}"></div>
            </Button>
        </div>
        <Button 
            variant="outline" 
            onclick={handleRefresh} 
            disabled={isRefreshing}
            class="ml-2 flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm"
        >
            <RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
            <span>refresh</span>
        </Button>
    </div>

    <!-- Floating Alert Messages -->
    {#if alertMessage}
        <div class="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 max-w-md animate-in slide-in-from-top-2">
            <Alert.Root variant={alertMessage.type === 'error' ? 'destructive' : 'default'} class="shadow-lg border">
                {#if alertMessage.type === 'error'}
                    <AlertCircle class="h-4 w-4" />
                {:else}
                    <CheckCircle2 class="h-4 w-4" />
                {/if}
                <Alert.Title class="text-sm font-medium">
                    {alertMessage.type === 'error' ? 'Error' : 'Success'}
                </Alert.Title>
                <Alert.Description class="text-sm flex items-center justify-between pr-2">
                    {alertMessage.message}
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
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onclick={() => {
                            // Download logic here
                            showAlert('Downloading logs...', 'success');
                        }}
                        class="h-8 w-8 p-0 rounded-lg text-xs border-gray-300 dark:border-zinc-700"
                        title="Download logs"
                    >
                        <Download class="h-3 w-3" />
                    </Button>
                </div>
                
                <!-- Log Content -->
                <div class="flex-1 bg-gray-900 dark:bg-black text-green-600 dark:text-green-400 font-mono text-sm overflow-hidden">
                    <div class="h-full w-full overflow-y-auto overflow-x-auto p-4">
                        <div class="leading-relaxed hover:bg-gray-800/30 dark:hover:bg-gray-900/50 px-2 py-1 rounded mb-1">
                            [2025-08-30T18:27:41.733Z] User {displayUserName} logged in
                        </div>
                        <div class="leading-relaxed hover:bg-gray-800/30 dark:hover:bg-gray-900/50 px-2 py-1 rounded mb-1">
                            [2025-08-30T18:27:43.734Z] Session started for user {displayUserName}
                        </div>
                        <div class="leading-relaxed hover:bg-gray-800/30 dark:hover:bg-gray-900/50 px-2 py-1 rounded mb-1">
                            [2025-08-30T18:27:45.735Z] Action performed: view dashboard
                        </div>
                        <div class="text-gray-500 dark:text-gray-400 animate-pulse mt-2">
                            ● Streaming...
                        </div>
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
                                    {poolDetail?.topologyId || 'Loading...'}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onclick={handleDownloadTopology}
                                    class="h-6 px-2 text-xs"
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
                    <Button onclick={handleSetTopology} disabled={!selectedTopologyId}>
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
                <Button onclick={() => statusDialogOpen = false} class="bg-primary text-primary-foreground hover:bg-primary/90">
                    {statusActionType === 'deploy' ? 'Deploy' : statusActionType === 'redeploy' ? 'Redeploy' : statusActionType === 'abort' ? 'Abort' : 'Destroy'}
                </Button>
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
                    onclick={() => {
                        showAlert('Fetching CTFd data to pool...', 'success');
                    }}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                >
                    <FileText class="h-4 w-4" />
                    Fetch CTFd Data to Pool
                </Button>

                <Button 
                    onclick={() => {
                        showAlert('Downloading CTFd logins...', 'success');
                    }}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                >
                    <Download class="h-4 w-4" />
                    Download CTFd Logins
                </Button>

                <Button 
                    onclick={() => {
                        showAlert('Downloading Wireguard configurations...', 'success');
                    }}
                    class="w-full justify-start gap-3 h-12"
                    variant="outline"
                >
                    <Download class="h-4 w-4" />
                    Download Wireguard
                </Button>
            </div>

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => accessDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
