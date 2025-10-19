<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import { Hand, FileText, Globe, Flag } from 'lucide-svelte';
    import type { PoolHealthCheck } from '$lib/api/types';

    type Props = {
        open: boolean;
        healthCheck: PoolHealthCheck;
        ctfdData?: any;
        onFetchCtfdData: () => Promise<void>;
        onDownloadCtfdLogins: () => Promise<void>;
        onDownloadWireguard: () => Promise<void>;
        onClose: () => void;
    };

    let { 
        open = $bindable(),
        healthCheck,
        ctfdData,
        onFetchCtfdData,
        onDownloadCtfdLogins,
        onDownloadWireguard,
        onClose
    }: Props = $props();

    const canFetchCtfd = $derived(
        healthCheck.users?.allExist && 
        healthCheck.topology?.matchPoolTopology && 
        healthCheck.status?.allDeployed
    );

    const canDownloadLogins = $derived(!!ctfdData);
    
    const canDownloadWireguard = $derived(healthCheck.users?.allExist);
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-2xl">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Hand class="h-5 w-5" />
                Manage Access
            </Dialog.Title>
            <Dialog.Description>
                Create CTFd data for pool, download CTFd users logins, or download users WireGuard configurations.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4 py-4">
            <!-- Fetch CTFd Data Section -->
            <button 
                class="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canFetchCtfd}
                onclick={onFetchCtfdData}
            >
                <div class="flex items-center gap-3 mb-2">
                    <Flag class="h-5 w-5" />
                    <h3 class="font-medium">Fetch CTFd Data to Pool</h3>
                </div>
                <p class="text-sm text-muted-foreground">
                    Requires users, topology and status processes to be finished successfully
                </p>
            </button>

            <!-- Download CTFd Logins Section -->
            <button 
                class="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canDownloadLogins}
                onclick={onDownloadCtfdLogins}
            >
                <div class="flex items-center gap-3 mb-2">
                    <FileText class="h-5 w-5" />
                    <h3 class="font-medium">Download CTFd Logins</h3>
                </div>
                <p class="text-sm text-muted-foreground">
                    Requires CTFd data to be fetched first
                </p>
            </button>

            <!-- Download Wireguard Section -->
            <button 
                class="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canDownloadWireguard}
                onclick={onDownloadWireguard}
            >
                <div class="flex items-center gap-3 mb-2">
                    <Globe class="h-5 w-5" />
                    <h3 class="font-medium">Download Wireguard</h3>
                </div>
                <p class="text-sm text-muted-foreground">
                    Requires all users to exist
                </p>
            </button>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={onClose}>
                Close
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
