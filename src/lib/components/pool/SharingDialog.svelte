<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Share2, X } from 'lucide-svelte';

    interface Props {
        open: boolean;
        onShare: () => Promise<void>;
        onUnshare: () => Promise<void>;
        onClose: () => void;
    }

    let { open = $bindable(), onShare, onUnshare, onClose }: Props = $props();
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Share2 class="h-5 w-5" />
                Manage Sharing
            </Dialog.Title>
            <Dialog.Description>
                Share or unshare the main user's range. Takes some time and might have to be initiated multiple times.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4">
            <Button 
                onclick={onShare}
                class="w-full justify-start gap-3 h-12"
                variant="outline"
            >
                <Share2 class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Share</span>
                    <span class="text-xs text-muted-foreground">Share main user's range to the rest of the pool users</span>
                </div>
            </Button>

            <Button 
                onclick={onUnshare}
                class="w-full justify-start gap-3 h-12"
                variant="outline"
            >
                <X class="h-4 w-4" />
                <div class="flex flex-col items-start">
                    <span>Unshare</span>
                    <span class="text-xs text-muted-foreground">Unshare main user's range to the rest of the pool users</span>
                </div>
            </Button>
        </div>

        <Dialog.Footer class="gap-2">
            <Button variant="outline" onclick={onClose}>Close</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
