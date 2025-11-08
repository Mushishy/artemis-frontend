<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Network } from 'lucide-svelte';

    interface Props {
        open: boolean;
        onDeploy: (concurrentRequests: number) => Promise<void>;
        onRedeploy: (concurrentRequests: number) => Promise<void>;
        onAbort: () => Promise<void>;
        onDestroy: () => Promise<void>;
        onClose: () => void;
    }

    let { open = $bindable(), onDeploy, onRedeploy, onAbort, onDestroy, onClose }: Props = $props();

    let statusActionType: 'deploy' | 'redeploy' | 'abort' | 'destroy' = $state('deploy');
    let concurrentRequests = $state(1);

    async function handleAction() {
        // Close dialog immediately
        open = false;
        
        // Then execute the action (don't await it)
        switch (statusActionType) {
            case 'deploy':
                onDeploy(concurrentRequests);
                break;
            case 'redeploy':
                onRedeploy(concurrentRequests);
                break;
            case 'abort':
                onAbort();
                break;
            case 'destroy':
                onDestroy();
                break;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Network class="h-5 w-5" />
                Manage Status
            </Dialog.Title>
            <Dialog.Description>
                Deploy only when all ranges are never deployed or destroyed, redeploy only when there have been some with errors while deploying, abort to stop all deployments, when all ranges are in error or aborted state you can destroy the pool.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-6">
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
            <div class="space-y-2 {statusActionType !== 'deploy' && statusActionType !== 'redeploy' ? 'opacity-50' : ''}">
                <div class="flex items-center gap-3">
                    <label for="concurrent-requests" class="text-sm font-medium">Concurrent Requests:</label>
                    <Input
                        id="concurrent-requests"
                        type="number"
                        bind:value={concurrentRequests}
                        min="1"
                        placeholder="4"
                        class="w-20"
                        disabled={statusActionType !== 'deploy' && statusActionType !== 'redeploy'}
                    />
                </div>
                <p class="text-xs text-muted-foreground">
                    Number of concurrent deployment requests (must be ≥ 1)
                </p>
            </div>
        </div>

        <Dialog.Footer class="gap-2">
            <Button variant="outline" onclick={onClose}>Cancel</Button>
            <Button 
                onclick={handleAction} 
                class={statusActionType === 'abort' || statusActionType === 'destroy' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            >
                {statusActionType.charAt(0).toUpperCase() + statusActionType.slice(1)}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
