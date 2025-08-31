<script lang="ts">
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Input } from '$lib/components/ui/input';
    import { 
        Shield, 
        AlertCircle, 
        CheckCircle2, 
        X 
    } from 'lucide-svelte';
    import type { Pool } from './data.js';
    import { 
        deletePool,
        updatePoolNote 
    } from './data.js';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let pools = $state(data?.pools || []);
    let deleteDialogOpen = $state(false);
    let noteDialogOpen = $state(false);
    let deletingPool: Pool | null = $state(null);
    let editingPool: Pool | null = $state(null);
    let noteInputValue = $state('');
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);

    const headers: { key: keyof Pool; label: string; sortable?: boolean }[] = [
        { key: 'note', label: 'Note', sortable: true },
        { key: 'createdBy', label: 'Created By', sortable: true },
        { key: 'topologyId', label: 'Topology ID', sortable: true },
        { key: 'createdAt', label: 'Created', sortable: true }
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

    function handleNote(pool: Pool) {
        editingPool = pool;
        noteInputValue = pool.note || '';
        noteDialogOpen = true;
    }

    function handleRowClick(pool: Pool) {
        // Navigate to pool detail page
        window.location.href = `/pool/${pool.poolId}`;
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

    async function saveNote() {
        if (!editingPool) return;

        try {
            await updatePoolNote(editingPool.poolId, noteInputValue);
            // Update the local pools array
            pools = pools.map(p => 
                p.poolId === editingPool!.poolId 
                    ? { ...p, note: noteInputValue }
                    : p
            );
            showAlert('Pool note updated successfully', 'success');
            noteDialogOpen = false;
            editingPool = null;
            noteInputValue = '';
        } catch (error) {
            console.error('Error updating pool note:', error);
            showAlert('Failed to update pool note', 'error');
        }
    }

    function closeNoteDialog() {
        noteDialogOpen = false;
        editingPool = null;
        noteInputValue = '';
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
            onRowClick={handleRowClick}
            onNote={handleNote}
            onDelete={handleDelete}
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

<!-- Note Edit Dialog -->
<Dialog.Root bind:open={noteDialogOpen}>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title>Edit Pool Note</Dialog.Title>
            <Dialog.Description>
                {#if editingPool}
                    Update the note for pool "{editingPool.poolId}".
                {/if}
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-4">
            <div>
                <label for="note-input" class="block text-sm font-medium mb-2">
                    Note:
                </label>
                <Input
                    id="note-input"
                    bind:value={noteInputValue}
                    placeholder="Enter a note for this pool..."
                    class="w-full"
                />
            </div>
        </div>

        <Dialog.Footer class="flex gap-2">
            <Button variant="outline" onclick={closeNoteDialog}>
                Cancel
            </Button>
            <Button onclick={saveNote}>
                Save Note
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
