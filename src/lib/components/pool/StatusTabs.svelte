<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { RefreshCw } from 'lucide-svelte';
    import type { PoolHealthCheck } from '$lib/api/types.js';

    interface Props {
        healthCheck: PoolHealthCheck;
        poolType?: string;
        ctfdData?: boolean;
        sharingStatus?: { shared: boolean; isLoading: boolean };
        isRefreshing: boolean;
        onUsersClick: () => void;
        onTopologyClick: () => void;
        onStatusClick: () => void;
        onSharingClick?: () => void;
        onAccessClick: () => void;
        onRefresh: () => void;
    }

    let { 
        healthCheck, 
        poolType, 
        ctfdData, 
        sharingStatus, 
        isRefreshing, 
        onUsersClick, 
        onTopologyClick, 
        onStatusClick, 
        onSharingClick, 
        onAccessClick, 
        onRefresh 
    }: Props = $props();

    function getStatusColor(status: boolean | null | undefined, isLoading: boolean = false): string {
        if (isLoading) return 'bg-gray-400';
        if (status === null || status === undefined) return 'bg-gray-400';
        return status ? 'bg-green-500' : 'bg-red-500';
    }
</script>

<div class="mb-6 flex items-center gap-2 flex-shrink-0">
    <div class="flex rounded-lg bg-gray-100 dark:bg-zinc-900 p-1 gap-1">
        <Button variant="outline" onclick={onUsersClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
            <span class="text-base font-medium">users</span>
            <div class="w-3 h-3 rounded-full {getStatusColor(healthCheck.users?.allExist, healthCheck.isLoading)}"></div>
        </Button>
        
        <Button variant="outline" onclick={onTopologyClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
            <span class="text-base font-medium">topology</span>
            <div class="w-3 h-3 rounded-full {getStatusColor(healthCheck.topology?.matchPoolTopology, healthCheck.isLoading)}"></div>
        </Button>
        
        <Button variant="outline" onclick={onStatusClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
            <span class="text-base font-medium">status</span>
            <div class="w-3 h-3 rounded-full {getStatusColor(healthCheck.status?.allDeployed, healthCheck.isLoading)}"></div>
        </Button>
        
        {#if poolType === 'SHARED' && onSharingClick}
            <Button variant="outline" onclick={onSharingClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">sharing</span>
                <div class="w-3 h-3 rounded-full {getStatusColor(sharingStatus?.shared, sharingStatus?.isLoading)}"></div>
            </Button>
        {/if}
        
        <Button variant="outline" onclick={onAccessClick} class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
            <span class="text-base font-medium">access</span>
            <div class="w-3 h-3 rounded-full {getStatusColor(ctfdData)}"></div>
        </Button>
    </div>
    
    <Button 
        variant="outline" 
        onclick={onRefresh} 
        disabled={isRefreshing}
        class="flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm ml-4"
    >
        <RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
        <span>refresh</span>
    </Button>
</div>
