<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Play, Square, FlaskConical } from 'lucide-svelte';
    import type { PoolHealthCheck } from '$lib/api/types';

    interface Props {
        open: boolean;
        healthCheck: PoolHealthCheck;
        onStartTesting: () => Promise<void>;
        onStopTesting: () => Promise<void>;
        onClose: () => void;
    }

    let { 
        open = $bindable(), 
        healthCheck,
        onStartTesting, 
        onStopTesting, 
        onClose 
    }: Props = $props();

    const canManageTesting = $derived(
        healthCheck.users?.allExist && 
        healthCheck.topology?.matchPoolTopology && 
        healthCheck.status?.allDeployed
    );
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <FlaskConical class="h-5 w-5" />
                Manage Testing
            </Dialog.Title>
            <Dialog.Description>
                Start or stop testing mode for all users in the pool. Testing mode prevents fetching CTFd data for pool.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4">
            <Button 
                onclick={onStartTesting}
                disabled={!canManageTesting}
                class="w-full justify-start gap-3 h-12"
                variant="outline"
            >
                <Play class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Start Testing</span>
                    <span class="text-xs text-muted-foreground">
                        {canManageTesting ? "Enable testing mode for all users in the pool" : "Requires Users, Topology, and Status to be green"}
                    </span>
                </div>
            </Button>

            <Button 
                onclick={onStopTesting}
                disabled={!canManageTesting}
                class="w-full justify-start gap-3 h-12"
                variant="outline"
            >
                <Square class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Stop Testing</span>
                    <span class="text-xs text-muted-foreground">
                        {canManageTesting ? "Disable testing mode for all users in the pool" : "Requires Users, Topology, and Status to be green"}
                    </span>
                </div>
            </Button>
        </div>

        <Dialog.Footer class="gap-2">
            <Button variant="outline" onclick={onClose}>Close</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>