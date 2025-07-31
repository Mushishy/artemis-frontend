<script lang="ts">
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import { AlertCircle, CheckCircle2, X } from 'lucide-svelte';
    import type { User } from './data.js';
    import { downloadWireGuardConfig } from './data.js';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);

    const headers: { key: keyof User; label: string; sortable?: boolean }[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'isAdmin', label: 'Admin', sortable: true },
        { key: 'dateCreated', label: 'Created', sortable: true }
    ];

    async function handleDownload(user: User) {
        try {
            await downloadWireGuardConfig(user.userID);
            showAlert('success', `WireGuard config for "${user.name}" downloaded successfully`);
        } catch (error) {
            showAlert('error', 'Failed to download WireGuard configuration');
        }
    }

    function showAlert(type: 'success' | 'error', message: string) {
        alertMessage = { type, message };
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Users</h1>
            <p class="text-sm text-muted-foreground">
                {data.users.length} user{data.users.length !== 1 ? 's' : ''} available
            </p>
        </div>
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
            data={data.users} 
            {headers} 
            maxHeight="calc(100% - 2rem)"
            showActions={true}
            onDownloadWireguard={handleDownload}
        />
    </div>
</div>
