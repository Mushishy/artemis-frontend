<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Network } from 'lucide-svelte';

    interface Props {
        open: boolean;
        onDeploy: () => Promise<void>;
        onRedeploy: () => Promise<void>;
        onAbort: () => Promise<void>;
        onDestroy: () => Promise<void>;
        onClose: () => void;
    }

    let { open = $bindable(), onDeploy, onRedeploy, onAbort, onDestroy, onClose }: Props = $props();

    let statusActionType: 'deploy' | 'redeploy' | 'abort' | 'destroy' = $state('deploy');

    async function handleAction() {
        switch (statusActionType) {
            case 'deploy':
                await onDeploy();
                break;
            case 'redeploy':
                await onRedeploy();
                break;
            case 'abort':
                await onAbort();
                break;
            case 'destroy':
                await onDestroy();
                break;
        }
        open = false;
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
                Deploy, redeploy, abort, or destroy the pool.
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
