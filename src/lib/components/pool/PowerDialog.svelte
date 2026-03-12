<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Power, PowerOff, Zap } from 'lucide-svelte';
    import type { PoolHealthCheck } from '$lib/api/types';

    interface Props {
        open: boolean;
        healthCheck: PoolHealthCheck;
        onPowerOn: () => Promise<void>;
        onPowerOff: () => Promise<void>;
        onClose: () => void;
    }

    let { 
        open = $bindable(), 
        healthCheck,
        onPowerOn, 
        onPowerOff, 
        onClose 
    }: Props = $props();

    const canManagePower = $derived(
        healthCheck.users?.allExist && 
        healthCheck.topology?.matchPoolTopology && 
        healthCheck.status?.allDeployed
    );
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Zap class="h-5 w-5" />
                Manage Range Power
            </Dialog.Title>
            <Dialog.Description>
                Power on or off all virtual machines for users with deployed topologies in the pool. Takes some time to complete.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4">
            <Button 
                onclick={onPowerOn}
                disabled={!canManagePower}
                class="w-full justify-start gap-3 h-12"
                variant="outline"
            >
                <Power class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Power On Ranges</span>
                    <span class="text-xs text-muted-foreground">
                        {canManagePower ? "Power on all VMs for users with deployed topologies in the pool" : "Requires Users, Topology, and Status to be green"}
                    </span>
                </div>
            </Button>

            <Button 
                onclick={onPowerOff}
                disabled={!canManagePower}
                class="w-full justify-start gap-3 h-12"
                variant="outline"
            >
                <PowerOff class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Power Off Ranges</span>
                    <span class="text-xs text-muted-foreground">
                        {canManagePower ? "Power off all VMs for users with deployed topologies in the pool" : "Requires Users, Topology, and Status to be green"}
                    </span>
                </div>
            </Button>
        </div>

        <Dialog.Footer class="gap-2">
            <Button variant="outline" onclick={onClose}>Close</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>