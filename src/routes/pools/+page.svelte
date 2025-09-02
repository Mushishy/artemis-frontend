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
        updatePoolNote,
        checkPoolStatus,
        unsharePool,
        deletePoolUsers,
        checkUsersExist,
        getPoolDetails
    } from './data.js';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let pools = $state(data?.pools || []);
    let deleteDialogOpen = $state(false);
    let noteDialogOpen = $state(false);
    let destroyUsersDialogOpen = $state(false);
    let deletingPool: Pool | null = $state(null);
    let editingPool: Pool | null = $state(null);
    let noteInputValue = $state('');
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);
    let isDeletingProcess = $state(false);

    const headers: { key: keyof Pool; label: string; sortable?: boolean }[] = [
        { key: 'note', label: 'Note', sortable: true },
        { key: 'createdBy', label: 'Created By', sortable: true },
        { key: 'topologyId', label: 'Topology ID', sortable: true },
        { key: 'type', label: 'Type', sortable: true }
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
            isDeletingProcess = true;
            
            // Step 1: Check pool status first - this is critical
            showAlert('Checking pool status...', 'success');
            const statusResponse = await checkPoolStatus(deletingPool.poolId);
            
            // Check if any user has a state that's not DESTROYED, UNKNOWN, or NEVER DEPLOYED
            const invalidStates = statusResponse.results.filter(result => {
                const state = result.state.toUpperCase();
                return !['DESTROYED', 'UNKNOWN', 'NEVER DEPLOYED'].includes(state);
            });

            if (invalidStates.length > 0) {
                const userStates = invalidStates.map(result => `${result.userId}: ${result.state}`).join(', ');
                showAlert(`Cannot delete pool. Users with active deployments: ${userStates}`, 'error');
                deleteDialogOpen = false;
                deletingPool = null;
                isDeletingProcess = false;
                return;
            }

            // Step 2: All status checks passed, now ask about user destruction
            showAlert('Pool status check passed. Ready for deletion.', 'success');
            deleteDialogOpen = false;
            destroyUsersDialogOpen = true;
            isDeletingProcess = false;

        } catch (error) {
            console.error('Error in delete process:', error);
            showAlert('Failed to check pool status', 'error');
            deleteDialogOpen = false;
            deletingPool = null;
            isDeletingProcess = false;
        }
    }

    async function confirmDestroyUsers() {
        if (!deletingPool) return;

        try {
            isDeletingProcess = true;

            // Step 3: If SHARED type, unshare the pool first
            if (deletingPool.type === 'SHARED') {
                showAlert('Getting pool details for unsharing...', 'success');
                const poolDetails = await getPoolDetails(deletingPool.poolId);
                if (!poolDetails.mainUser) {
                    throw new Error('Cannot unshare pool: mainUser not found');
                }
                showAlert('Unsharing pool...', 'success');
                await unsharePool(deletingPool.poolId, poolDetails.mainUser);
            }

            // Step 4: Delete users in the pool
            showAlert('Deleting pool users... This process will take a while', 'success');
            await deletePoolUsers(deletingPool.poolId);

            // Step 5: Wait and check if users are deleted (allExist should be false)
            showAlert('Waiting for users to be deleted...', 'success');
            let usersDeleted = false;
            let attempts = 0;
            const maxAttempts = 20; // Increased attempts for safety

            while (!usersDeleted && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                attempts++;
                showAlert(`Checking user deletion progress... (${attempts}/${maxAttempts})`, 'success');
                
                const userCheckResponse = await checkUsersExist(deletingPool.poolId);
                
                if (!userCheckResponse.allExist) {
                    usersDeleted = true;
                    showAlert('All users deleted successfully', 'success');
                } else {
                    console.log(`Attempt ${attempts}: Users still exist, waiting...`);
                }
            }

            if (!usersDeleted) {
                showAlert('Users deletion is taking longer than expected. Please check manually and try again later.', 'error');
                destroyUsersDialogOpen = false;
                deletingPool = null;
                isDeletingProcess = false;
                return;
            }

            // Step 6: Only now delete the pool after all checks pass
            showAlert('Deleting pool...', 'success');
            await deletePool(deletingPool.poolId);
            pools = pools.filter(p => p.poolId !== deletingPool!.poolId);
            showAlert('Pool and users deleted successfully', 'success');

        } catch (error) {
            console.error('Error in destroy users process:', error);
            showAlert(`Failed during deletion process: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }

        destroyUsersDialogOpen = false;
        deletingPool = null;
        isDeletingProcess = false;
    }

    async function skipDestroyUsers() {
        if (!deletingPool) return;

        try {
            isDeletingProcess = true;

            // Step 3: If SHARED type, unshare the pool first
            if (deletingPool.type === 'SHARED') {
                showAlert('Getting pool details for unsharing...', 'success');
                const poolDetails = await getPoolDetails(deletingPool.poolId);
                if (!poolDetails.mainUser) {
                    throw new Error('Cannot unshare pool: mainUser not found');
                }
                showAlert('Unsharing pool...', 'success');
                await unsharePool(deletingPool.poolId, poolDetails.mainUser);
                showAlert('Pool unshared successfully', 'success');
            }

            // Step 4: Just delete the pool without deleting users
            showAlert('Deleting pool (preserving users)...', 'success');
            await deletePool(deletingPool.poolId);
            pools = pools.filter(p => p.poolId !== deletingPool!.poolId);
            showAlert('Pool deleted successfully (users preserved)', 'success');
        } catch (error) {
            console.error('Error deleting pool:', error);
            showAlert(`Failed to delete pool: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }

        destroyUsersDialogOpen = false;
        deletingPool = null;
        isDeletingProcess = false;
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
                {data.pools.length} pool{data.pools.length !== 1 ? 's' : ''} available
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
            <AlertDialog.Title>Delete Pool</AlertDialog.Title>
            <AlertDialog.Description>
                {#if deletingPool}
                    {#if isDeletingProcess}
                        Checking pool status for <strong>"{deletingPool.poolId}"</strong>
                    {:else}
                        This will check the pool status and guide you through the deletion process for 
                        <strong>"{deletingPool.poolId}"</strong>.
                    {/if}
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={() => { deleteDialogOpen = false; deletingPool = null; }} disabled={isDeletingProcess}>
                Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action onclick={confirmDelete} disabled={isDeletingProcess} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {#if isDeletingProcess}
                    Checking...
                {:else}
                    Check & Delete
                {/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Destroy Users Dialog -->
<AlertDialog.Root bind:open={destroyUsersDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Destroy Users in Pool?</AlertDialog.Title>
            <AlertDialog.Description>
                {#if deletingPool}
                    Do you want to destroy all users inside pool <strong>"{deletingPool.poolId}"</strong>?
                    <br><br>
                    <strong>Yes:</strong> Delete all users in the pool and then delete the pool (recommended)
                    <br>
                    <strong>No:</strong> Only delete the pool, preserve users for other pools
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={skipDestroyUsers} disabled={isDeletingProcess}>
                No (Preserve Users)
            </AlertDialog.Cancel>
            <AlertDialog.Action onclick={confirmDestroyUsers} disabled={isDeletingProcess} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {#if isDeletingProcess}
                    Processing...
                {:else}
                    Yes (Destroy Users)
                {/if}
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
                    placeholder="Enter a note for this pool"
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
