<script lang="ts">
    import { onMount } from 'svelte';
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import { 
        RefreshCw, 
        AlertCircle, 
        CheckCircle2, 
        X 
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

    const userHeaders: { key: keyof PoolUser; label: string; sortable?: boolean }[] = [
        { key: 'user', label: 'User Name', sortable: true },
        { key: 'userId', label: 'User ID', sortable: true },
        { key: 'team', label: 'Team', sortable: true }
    ];

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

    <!-- Status Navigation -->
    <div class="mb-6 flex items-center gap-4 flex-shrink-0">
        <!-- Users -->
        <Button variant="outline" class="flex items-center gap-3">
            <span class="text-lg font-medium">users</span>
            <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.users)}"></div>
        </Button>

        <!-- Topology -->
        <Button variant="outline" class="flex items-center gap-3">
            <span class="text-lg font-medium">topology</span>
            <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.topology)}"></div>
        </Button>

        <!-- Status -->
        <Button variant="outline" class="flex items-center gap-3">
            <span class="text-lg font-medium">status</span>
            <span class="text-sm text-muted-foreground">
                {poolData.status || 'Loading...'}
            </span>
        </Button>

        <!-- Flags -->
        <Button variant="outline" class="flex items-center gap-3">
            <span class="text-lg font-medium">flags</span>
            <div class="w-3 h-3 rounded-full {getStatusPointColor(poolData.flags)}"></div>
        </Button>

        <!-- Refresh -->
        <Button 
            variant="outline" 
            onclick={handleRefresh} 
            disabled={isRefreshing}
            class="flex items-center gap-2"
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

    <!-- Users Table -->
    <div class="flex-1 min-h-0 w-full overflow-hidden pb-4">
        {#if poolDetail?.usersAndTeams}
            <DataTable 
                data={poolDetail.usersAndTeams} 
                headers={userHeaders}
                maxHeight="calc(100% - 2rem)"
                showActions={true}
                onDownloadLogins={handleUserLogs}
                onDownloadWireguard={handleUserWireguard}
            />
        {:else}
            <div class="flex items-center justify-center h-32">
                <p class="text-muted-foreground">Loading users...</p>
            </div>
        {/if}
    </div>
</div>
