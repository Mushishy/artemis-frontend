<script lang="ts">
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import { 
        Shield, 
        AlertCircle, 
        CheckCircle2, 
        X 
    } from 'lucide-svelte';
    import type { Pool } from './data.js';
    import { 
        downloadCtfdData, 
        downloadLogins, 
        downloadWireguardConfigs, 
        deletePool 
    } from './data.js';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let pools = $state(data?.pools || []);
    let deleteDialogOpen = $state(false);
    let deletingPool: Pool | null = $state(null);
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);

    const headers: { key: keyof Pool; label: string; sortable?: boolean }[] = [
        { key: 'note', label: 'Note', sortable: true },
        { key: 'createdBy', label: 'Created By', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'topologyId', label: 'Topology ID', sortable: true },
        { key: 'ctfdDataId', label: 'CTFD Data ID', sortable: true }
    ];

    function showAlert(message: string, type: 'success' | 'error') {
        alertMessage = { message, type };
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function handlePoolDetail(pool: Pool) {
        // TODO: Navigate to pool detail page
        showAlert('Pool detail functionality coming soon', 'success');
    }

    function handleEdit(pool: Pool) {
        handlePoolDetail(pool);
    }

    function handleDownload(pool: Pool) {
        handleDownloadCtfdData(pool);
    }

    function handleDelete(pool: Pool) {
        deletingPool = pool;
        deleteDialogOpen = true;
    }

    async function confirmDelete() {
        if (!deletingPool) return;

        try {
            await deletePool(deletingPool.poolId);
            pools = pools.filter(p => p.poolId !== deletingPool!.poolId);
            showAlert('Pool deleted successfully', 'success');
            deleteDialogOpen = false;
            deletingPool = null;
        } catch (error) {
            console.error('Error deleting pool:', error);
            showAlert('Failed to delete pool', 'error');
        }
    }

    async function handleDownloadCtfdData(pool: Pool) {
        try {
            await downloadCtfdData(pool.poolId);
            showAlert('CTFD data download started', 'success');
        } catch (error) {
            console.error('Error downloading CTFD data:', error);
            showAlert('Failed to download CTFD data', 'error');
        }
    }

    async function handleDownloadLogins(pool: Pool) {
        try {
            await downloadLogins(pool.poolId);
            showAlert('Logins CSV download started', 'success');
        } catch (error) {
            console.error('Error downloading logins:', error);
            showAlert('Failed to download logins', 'error');
        }
    }

    async function handleDownloadWireguard(pool: Pool) {
        try {
            await downloadWireguardConfigs(pool.poolId);
            showAlert('Wireguard configs download started', 'success');
        } catch (error) {
            console.error('Error downloading Wireguard configs:', error);
            showAlert('Failed to download Wireguard configs', 'error');
        }
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Pools</h1>
            <p class="text-sm text-muted-foreground">
                Manage and monitor your training pools
            </p>
        </div>
        
        <Button href="/create" class="gap-2">
            <Shield class="h-4 w-4" />
            Create Pool
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

    <div class="flex-1 min-h-0 w-full overflow-hidden pb-4">
        <DataTable 
            data={pools} 
            {headers}
            maxHeight="calc(100% - 2rem)"
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDownloadCtfdData={handleDownloadCtfdData}
            onDownloadLogins={handleDownloadLogins}
            onDownloadWireguard={handleDownloadWireguard}
        />
    </div>
</div>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
            <AlertDialog.Description>
                {#if deletingPool}
                    This action cannot be undone. This will permanently delete the pool 
                    <strong>"{deletingPool.poolId}"</strong> and remove it from the system.
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={() => { deleteDialogOpen = false; deletingPool = null; }}>
                Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action onclick={confirmDelete} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
