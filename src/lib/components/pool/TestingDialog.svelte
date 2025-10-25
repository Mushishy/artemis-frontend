<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import { Play, Square, FlaskConical } from 'lucide-svelte';
    import type { PoolHealthCheck } from '$lib/api/types';

    type Props = {
        open: boolean;
        healthCheck: PoolHealthCheck;
        testingStatus?: { allSame: boolean; testingEnabled: boolean; isLoading: boolean };
        onStartTesting: () => Promise<void>;
        onStopTesting: () => Promise<void>;
        onClose: () => void;
    };

    let { 
        open = $bindable(),
        healthCheck,
        testingStatus,
        onStartTesting,
        onStopTesting,
        onClose
    }: Props = $props();

    let isProcessing = $state(false);

    const canManageTesting = $derived(
        healthCheck.users?.allExist && 
        healthCheck.topology?.matchPoolTopology && 
        healthCheck.status?.allDeployed
    );

    const canStartTesting = $derived(
        canManageTesting && 
        testingStatus?.allSame && 
        !testingStatus?.testingEnabled
    );
    
    const canStopTesting = $derived(
        canManageTesting && 
        testingStatus?.allSame && 
        testingStatus?.testingEnabled
    );

    async function handleStartTesting() {
        if (!canStartTesting) return;
        
        isProcessing = true;
        
        try {
            await onStartTesting();
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            isProcessing = false;
        }
    }

    async function handleStopTesting() {
        if (!canStopTesting) return;
        
        isProcessing = true;
        
        try {
            await onStopTesting();
        } catch (error) {
            // Error handling is done in the parent component
        } finally {
            isProcessing = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-2xl">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <FlaskConical class="h-5 w-5" />
                Manage Testing
            </Dialog.Title>
            <Dialog.Description>
                Start or stop testing mode for all users in the pool.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4 py-4">
            <!-- Start Testing Section -->
            <button 
                class="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canStartTesting || isProcessing}
                onclick={handleStartTesting}
            >
                <div class="flex items-center gap-3 mb-2">
                    <Play class="h-5 w-5" />
                    <h3 class="font-medium">Start Testing</h3>
                </div>
                <p class="text-sm text-muted-foreground">
                    {#if !canManageTesting}
                        Requires users, topology and status processes to be finished successfully
                    {:else if !testingStatus?.allSame}
                        Testing status must be consistent across all users
                    {:else if testingStatus?.testingEnabled}
                        Testing is already enabled
                    {:else}
                        Enable testing mode for all users in the pool
                    {/if}
                </p>
                <p class="text-sm text-muted-foreground mt-2">
                    <strong>Warning:</strong> If you enable testing, CTFd data will not be able to be retrieved from logs.
                </p>
            </button>

            <!-- Stop Testing Section -->
            <button 
                class="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canStopTesting || isProcessing}
                onclick={handleStopTesting}
            >
                <div class="flex items-center gap-3 mb-2">
                    <Square class="h-5 w-5" />
                    <h3 class="font-medium">Stop Testing</h3>
                </div>
                <p class="text-sm text-muted-foreground">
                    {#if !canManageTesting}
                        Requires users, topology and status processes to be finished successfully
                    {:else if !testingStatus?.allSame}
                        Testing status must be consistent across all users
                    {:else if !testingStatus?.testingEnabled}
                        Testing is already disabled
                    {:else}
                        Disable testing mode for all users in the pool
                    {/if}
                </p>
                <p class="text-sm text-muted-foreground mt-2">
                    <strong>Warning:</strong> If you are unable to stop testing mode, you will have to redeploy the pool.
                </p>
            </button>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={onClose} disabled={isProcessing}>
                Close
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>