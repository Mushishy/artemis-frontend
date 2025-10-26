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
        
        <div class="space-y-4">
            <Button 
                onclick={onFetchCtfdData}
                disabled={!canFetchCtfd}
                variant="outline"
                class="w-full justify-start gap-3 h-12"
            >
                <Flag class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Fetch CTFd Data to Pool</span>
                    <span class="text-xs text-muted-foreground">Requires users, topology and status processes to be finished</span>
                </div>
            </Button>

            <Button 
                onclick={onDownloadCtfdLogins}
                disabled={!canDownloadLogins}
                variant="outline"
                class="w-full justify-start gap-3 h-12"
            >
                <FileText class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Download CTFd Logins</span>
                    <span class="text-xs text-muted-foreground">Requires CTFd data to be fetched first</span>
                </div>
            </Button>

            <Button 
                onclick={onDownloadWireguard}
                disabled={!canDownloadWireguard}
                variant="outline"
                class="w-full justify-start gap-3 h-12"
            >
                <Globe class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Download Wireguard</span>
                    <span class="text-xs text-muted-foreground">Requires all users to exist</span>
                </div>
            </Button>
        </div>

        <Dialog.Footer class="gap-2">
            <Button variant="outline" onclick={onClose}>Close</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
