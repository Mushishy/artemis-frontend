<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { Users, Share, X, CheckCircle, ChevronsUpDown } from 'lucide-svelte';
    import { tick } from 'svelte';
    import { getCurrentMainUsers } from '$lib/api/client/users.client';
    import { getPoolSummaries, sharePoolToUser, unsharePoolFromUser, checkRangeSharedToUser } from '$lib/api/client/pools.client';

    interface Props {
        open: boolean;
        onClose: () => void;
        onShowAlert?: (message: string, type: 'success' | 'error') => void;
    }

    let { open = $bindable(), onClose, onShowAlert }: Props = $props();

    // State
    let mainUsers = $state<string[]>([]);
    let pools = $state<Array<{ poolId: string; note: string }>>([]);
    let selectedUserId = $state('');
    let selectedPoolId = $state('');
    let isLoading = $state(false);
    let statusMessage = $state('');
    let statusType = $state<'success' | 'error' | ''>('');

    // Combobox state
    let userOpen = $state(false);
    let poolOpen = $state(false);
    let userTriggerRef = $state<HTMLButtonElement>(null!);
    let poolTriggerRef = $state<HTMLButtonElement>(null!);

    // Transform data for combobox format
    const userOptions = $derived(
        mainUsers.map(userId => ({
            value: userId,
            label: userId,
            description: `User: ${userId}`
        }))
    );

    const poolOptions = $derived(
        pools.map(pool => ({
            value: pool.poolId,
            label: pool.note || pool.poolId,
            description: `ID: ${pool.poolId}`
        }))
    );

    // Selected values for comboboxes
    const selectedUserLabel = $derived(
        userOptions.find((u) => u.value === selectedUserId)?.label
    );

    const selectedPoolLabel = $derived(
        poolOptions.find((p) => p.value === selectedPoolId)?.label
    );

    // Load data when dialog opens
    $effect(() => {
        if (open) {
            loadData();
        }
    });

    async function loadData() {
        isLoading = true;
        try {
            const [mainUsersResult, poolsResult] = await Promise.all([
                getCurrentMainUsers(),
                getPoolSummaries()
            ]);
            
            mainUsers = mainUsersResult.userIds;
            pools = poolsResult;
        } catch (error) {
            console.error('Failed to load data:', error);
            if (onShowAlert) onShowAlert('Failed to load users and pools data', 'error');
        } finally {
            isLoading = false;
        }
    }

    // Helper functions for comboboxes
    function closeAndFocusUserTrigger() {
        userOpen = false;
        tick().then(() => {
            userTriggerRef?.focus();
        });
    }

    function closeAndFocusPoolTrigger() {
        poolOpen = false;
        tick().then(() => {
            poolTriggerRef?.focus();
        });
    }

    function handleUserChange(value: string) {
        selectedUserId = value;
    }

    function handlePoolChange(value: string) {
        selectedPoolId = value;
    }

    async function handleShare() {
        if (!selectedUserId || !selectedPoolId) {
            if (onShowAlert) onShowAlert('Please select both a user and a pool', 'error');
            return;
        }

        isLoading = true;
        try {
            const result = await sharePoolToUser(selectedPoolId, selectedUserId);
            
            if (result.results && result.results.length > 0) {
                const errors = result.results.filter(r => r.response?.error);
                if (errors.length > 0) {
                    const errorMessages = errors.map(e => e.response.error).join(', ');
                    if (onShowAlert) onShowAlert(`Share failed: ${errorMessages}`, 'error');
                } else {
                    if (onShowAlert) onShowAlert(`Successfully shared pool to ${selectedUserId}`, 'success');
                }
            } else {
                if (onShowAlert) onShowAlert(`Successfully shared pool to ${selectedUserId}`, 'success');
            }
        } catch (error: any) {
            if (onShowAlert) onShowAlert('Failed to share pool to user', 'error');
        } finally {
            isLoading = false;
        }
    }

    async function handleUnshare() {
        if (!selectedUserId || !selectedPoolId) {
            if (onShowAlert) onShowAlert('Please select both a user and a pool', 'error');
            return;
        }

        isLoading = true;
        try {
            const result = await unsharePoolFromUser(selectedPoolId, selectedUserId);
            
            if (result.results && result.results.length > 0) {
                const errors = result.results.filter(r => r.response?.error);
                if (errors.length > 0) {
                    const errorMessages = errors.map(e => e.response.error).join(', ');
                    if (onShowAlert) onShowAlert(`Unshare failed: ${errorMessages}`, 'error');
                } else {
                    if (onShowAlert) onShowAlert(`Successfully unshared pool from ${selectedUserId}`, 'success');
                }
            } else {
                if (onShowAlert) onShowAlert(`Successfully unshared pool from ${selectedUserId}`, 'success');
            }
        } catch (error: any) {
            if (onShowAlert) onShowAlert('Failed to unshare pool from user', 'error');
        } finally {
            isLoading = false;
        }
    }

    async function handleCheckStatus() {
        if (!selectedUserId || !selectedPoolId) {
            statusMessage = 'Please select both a user and a pool';
            statusType = 'error';
            return;
        }

        isLoading = true;
        statusMessage = '';
        statusType = '';
        
        try {
            const result = await checkRangeSharedToUser(selectedPoolId, selectedUserId);
            
            if (result.shared) {
                statusMessage = 'Shared';
            } else if (result.unshared) {
                statusMessage = 'Not Shared';
            } else {
                statusMessage = 'Unknown';
            }
            
            statusType = 'success';
        } catch (error: any) {
            statusMessage = 'Error';
            statusType = 'error';
        } finally {
            isLoading = false;
        }
    }

    function resetForm() {
        selectedUserId = '';
        selectedPoolId = '';
        statusMessage = '';
        statusType = '';
    }

    function handleClose() {
        resetForm();
        onClose();
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-md">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Share class="h-5 w-5" />
                Manage Observer User Sharing
            </Dialog.Title>
            <Dialog.Description>
                Share or unshare all ranges within pool to a given user. Takes some time and might have to be initiated multiple times. Before destroying pool don't forget to unshare.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-6">
            <!-- User Selection -->
            <div class="space-y-3">
                <div class="text-sm font-medium">Select User</div>
                <Popover.Root bind:open={userOpen}>
                    <Popover.Trigger bind:ref={userTriggerRef}>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                variant="outline"
                                class="w-full justify-between"
                                role="combobox"
                                aria-expanded={userOpen}
                                disabled={isLoading}
                            >
                                {selectedUserLabel || "Select user..."}
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        {/snippet}
                    </Popover.Trigger>
                    <Popover.Content class="w-full p-0">
                        <Command.Root>
                            <Command.Input placeholder="Search users..." />
                            <Command.List>
                                <Command.Empty>No user found.</Command.Empty>
                                <Command.Group>
                                    {#each userOptions as user (user.value)}
                                        <Command.Item
                                            value={user.label}
                                            onSelect={() => {
                                                handleUserChange(user.value);
                                                closeAndFocusUserTrigger();
                                            }}
                                        >
                                            <div class="flex flex-col">
                                                <span>{user.label}</span>
                                                {#if user.description}
                                                    <span class="text-xs text-muted-foreground">{user.description}</span>
                                                {/if}
                                            </div>
                                        </Command.Item>
                                    {/each}
                                </Command.Group>
                            </Command.List>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>
            </div>

            <!-- Pool Selection -->
            <div class="space-y-3">
                <div class="text-sm font-medium">Select Pool</div>
                <Popover.Root bind:open={poolOpen}>
                    <Popover.Trigger bind:ref={poolTriggerRef}>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                variant="outline"
                                class="w-full justify-between"
                                role="combobox"
                                aria-expanded={poolOpen}
                                disabled={isLoading}
                            >
                                {selectedPoolLabel || "Select pool..."}
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        {/snippet}
                    </Popover.Trigger>
                    <Popover.Content class="w-full p-0">
                        <Command.Root>
                            <Command.Input placeholder="Search pools..." />
                            <Command.List>
                                <Command.Empty>No pool found.</Command.Empty>
                                <Command.Group>
                                    {#each poolOptions as pool (pool.value)}
                                        <Command.Item
                                            value={pool.label}
                                            onSelect={() => {
                                                handlePoolChange(pool.value);
                                                closeAndFocusPoolTrigger();
                                            }}
                                        >
                                            <div class="flex flex-col">
                                                <span>{pool.label}</span>
                                                {#if pool.description}
                                                    <span class="text-xs text-muted-foreground">{pool.description}</span>
                                                {/if}
                                            </div>
                                        </Command.Item>
                                    {/each}
                                </Command.Group>
                            </Command.List>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3">
                <!-- Share and Unshare buttons side by side -->
                <div class="flex gap-2">
                    <Button 
                        onclick={handleUnshare}
                        variant="outline"
                        disabled={!selectedUserId || !selectedPoolId || isLoading}
                        class="flex-1 flex items-center justify-center gap-2"
                    >
                        <X class="h-4 w-4" />
                        Unshare
                    </Button>

                    <Button 
                        onclick={handleShare}
                        disabled={!selectedUserId || !selectedPoolId || isLoading}
                        class="flex-1 flex items-center justify-center gap-2"
                    >
                        <Share class="h-4 w-4" />
                        Share
                    </Button>
                </div>

                <!-- Check Status button with status result on the right -->
                <div class="flex gap-2">
                    <Button 
                        onclick={handleCheckStatus}
                        variant="outline"
                        disabled={!selectedUserId || !selectedPoolId || isLoading}
                        class="flex-1 flex items-center justify-center gap-2"
                    >
                        <CheckCircle class="h-4 w-4" />
                        Check Status
                    </Button>
                    
                    <div class="flex-1 flex items-center justify-center min-h-[2.5rem] border rounded-md bg-muted/30">
                        {#if statusMessage}
                            <span class="text-sm font-medium">{statusMessage}</span>
                        {:else}
                            <span class="text-sm text-muted-foreground">Status</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <Dialog.Footer class="flex justify-end">
            <Button variant="outline" onclick={handleClose}>Close</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>