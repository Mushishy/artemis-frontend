<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { Users, Search, Check, ChevronsUpDown } from 'lucide-svelte';
    import { tick } from 'svelte';
    import { getMainUsers } from '$lib/api/client/users.client';
    import type { PatchUserRequest } from '$lib/api/types.js';

    interface Props {
        open: boolean;
        poolId: string;
        poolType: string;
        missingUsers: string[];
        onImport: () => Promise<void>;
        onPatch: (users: PatchUserRequest[]) => Promise<void>;
        onCheckUsers: (users: PatchUserRequest[]) => Promise<void>;
        onClose: () => void;
        onShowAlert?: (message: string, type: 'success' | 'error') => void;
    }

    let { open = $bindable(), poolId, poolType, missingUsers, onImport, onPatch, onCheckUsers, onClose, onShowAlert }: Props = $props();

    let userActionType: 'import' | 'patch' = $state('import');
    let patchUserInput = $state('');
    
    // Main users functionality for SHARED pools
    let mainUsersOpen = $state(false);
    let mainUsersTriggerRef = $state<HTMLButtonElement>(null!);
    let mainUsersData = $state<string[]>([]);

    // Transform main users data for combobox format
    const mainUsersOptions = $derived(
        mainUsersData.map(userId => ({
            value: userId,
            label: userId,
            description: `Main User: ${userId}`
        }))
    );

    // Load main users data when dialog opens for SHARED pools
    $effect(() => {
        if (open && poolType === 'SHARED') {
            async function loadMainUsersData() {
                try {
                    const result = await getMainUsers(poolId);
                    mainUsersData = result.userIds;
                } catch (error) {
                    console.error('Failed to load main users:', error);
                    mainUsersData = [];
                }
            }
            loadMainUsersData();
        }
    });

    // Helper functions for main user search
    function closeAndFocusMainUsersTrigger() {
        mainUsersOpen = false;
        tick().then(() => {
            mainUsersTriggerRef?.focus();
        });
    }

    function parseBulkUsers(input: string): PatchUserRequest[] {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: PatchUserRequest[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(',').map(part => part.trim());
            
            if (poolType === 'SHARED') {
                // For SHARED: "Username, MainUserId, Team" or "Username, MainUserId"
                if (parts.length >= 2) {
                    users.push({
                        user: parts[0],
                        mainUserId: parts[1],
                        team: parts.length >= 3 ? parts[2] : undefined
                    });
                }
            } else {
                // For INDIVIDUAL: "Username, Team" or "Username"
                if (parts.length >= 1) {
                    users.push({
                        user: parts[0],
                        team: parts.length >= 2 ? parts[1] : undefined
                    });
                }
            }
        }
        
        return users;
    }

    async function handleImport() {
        await onImport();
        open = false;
    }

    async function handlePatch() {
        const users = parseBulkUsers(patchUserInput);
        if (users.length === 0) return;
        
        // For SHARED pools, validate mainUserId before patching
        if (poolType === 'SHARED') {
            const usersWithoutMainUserId = users.filter(u => !u.mainUserId?.trim());
            if (usersWithoutMainUserId.length > 0) {
                onShowAlert?.('MainUserId is mandatory for all users in SHARED pools. Please check your input format.', 'error');
                return;
            }
            
            // Validate that all mainUserIds are valid (exist in mainUsersData)
            const invalidMainUsers = users.filter(u => !mainUsersData.includes(u.mainUserId!.trim()));
            if (invalidMainUsers.length > 0) {
                const invalidIds = [...new Set(invalidMainUsers.map(u => u.mainUserId))].join(', ');
                onShowAlert?.(`Invalid MainUserId(s): ${invalidIds}. MainUserId must be one of the available main users.`, 'error');
                return;
            }
        }
        
        await onPatch(users);
        open = false;
        patchUserInput = '';
    }

    async function handleCheckUsers() {
        const users = parseBulkUsers(patchUserInput);
        if (users.length === 0) return;
        
        // For SHARED pools, validate mainUserId
        if (poolType === 'SHARED') {
            const usersWithoutMainUserId = users.filter(u => !u.mainUserId?.trim());
            if (usersWithoutMainUserId.length > 0) {
                onShowAlert?.('MainUserId is mandatory for all users in SHARED pools. Please check your input format.', 'error');
                return;
            }
            
            // Validate that all mainUserIds are valid
            const invalidMainUsers = users.filter(u => !mainUsersData.includes(u.mainUserId!.trim()));
            if (invalidMainUsers.length > 0) {
                const invalidIds = [...new Set(invalidMainUsers.map(u => u.mainUserId))].join(', ');
                onShowAlert?.(`Invalid MainUserId(s): ${invalidIds}. MainUserId must be one of the available main users.`, 'error');
                return;
            }
        }
        
        await onCheckUsers(users);
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Users class="h-5 w-5" />
                Manage Users
            </Dialog.Title>
            <Dialog.Description>
                Import missing users in BATCHuser format into Ludus or patch additional users into the pool definition.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-6">
            <!-- Action Type Selection -->
            <div class="space-y-3">
                <div class="text-sm font-medium">Action Type</div>
                <div class="grid grid-cols-2 gap-4">
                    <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {userActionType === 'import' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                        <input type="radio" bind:group={userActionType} value="import" class="text-primary" />
                        <span class="text-sm font-medium">Import</span>
                    </label>
                    <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {userActionType === 'patch' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                        <input type="radio" bind:group={userActionType} value="patch" class="text-primary" />
                        <span class="text-sm font-medium">Patch</span>
                    </label>
                </div>
            </div>

            <!-- Content Area -->
            <div class="min-h-[16rem]">
                {#if userActionType === 'import'}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Missing Users</div>
                            <div class="h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                                {#each missingUsers as user}
                                    <div class="flex items-center justify-between p-2 border rounded-lg">
                                        <span class="text-sm">{user}</span>
                                        <span class="text-xs text-muted-foreground">Missing</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Pool Users and Teams *</div>
                            <p class="text-xs text-muted-foreground">
                                {#if poolType === 'SHARED'}
                                    Enter one per line "Username, MainUserId, Team" or "Username, MainUserId"
                                    <br/>MainUserId is mandatory
                                {:else}
                                    Enter one per line "Username, Team" or "Username"
                                {/if}
                            </p>
                            <textarea
                                bind:value={patchUserInput}
                                placeholder={poolType === 'SHARED' ? 
                                    "Alice Dan, MainUser1, smurfs\nBob Dylan, MainUser2, gargamel" : 
                                    "Alice Dan, smurfs\nBob Dylan, gargamel"}
                                class="w-full h-48 px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                            ></textarea>
                            <p class="text-xs text-muted-foreground">
                                {parseBulkUsers(patchUserInput).length} user(s) parsed
                            </p>
                            
                            <!-- Main User Search Helper (for SHARED pools only) -->
                            {#if poolType === 'SHARED'}
                                <div class="space-y-3 pt-2 border-t">
                                    <div class="text-sm font-medium">Main User Search Helper</div>
                                    <p class="text-xs text-muted-foreground">
                                        Search main users to help with input formatting
                                    </p>
                                    <Popover.Root bind:open={mainUsersOpen}>
                                        <Popover.Trigger bind:ref={mainUsersTriggerRef}>
                                            {#snippet child({ props })}
                                                <Button
                                                    {...props}
                                                    variant="outline"
                                                    class="w-full justify-between"
                                                    role="combobox"
                                                    aria-expanded={mainUsersOpen}
                                                >
                                                    Search main users...
                                                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            {/snippet}
                                        </Popover.Trigger>
                                        <Popover.Content class="w-full p-0">
                                            <Command.Root>
                                                <Command.Input placeholder="Search main users..." />
                                                <Command.List>
                                                    <Command.Empty>No main user found.</Command.Empty>
                                                    <Command.Group>
                                                        {#each mainUsersOptions as mainUser (mainUser.value)}
                                                            <Command.Item
                                                                value={mainUser.label}
                                                                onSelect={() => {
                                                                    closeAndFocusMainUsersTrigger();
                                                                }}
                                                            >
                                                                <div class="flex flex-col">
                                                                    <span>{mainUser.label}</span>
                                                                    {#if mainUser.description}
                                                                        <span class="text-xs text-muted-foreground">{mainUser.description}</span>
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
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <Dialog.Footer class="flex justify-end gap-2">
            {#if userActionType === 'patch'}
                <Button 
                    onclick={handleCheckUsers}
                    variant="outline"
                    disabled={!patchUserInput.trim()}
                    class="flex items-center gap-2"
                >
                    <Search class="h-4 w-4" />
                    Check Users in Pools
                </Button>
                <div class="flex-1"></div>
            {/if}
            <Button variant="outline" onclick={onClose}>Cancel</Button>
            {#if userActionType === 'import'}
                <Button onclick={handleImport} disabled={missingUsers.length === 0}>
                    Import {missingUsers.length} Users
                </Button>
            {:else}
                <Button onclick={handlePatch} disabled={!patchUserInput.trim()}>
                    Patch Users
                </Button>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
