<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Users, Search } from 'lucide-svelte';
    import type { PatchUserRequest } from '$lib/api/types.js';

    interface Props {
        open: boolean;
        missingUsers: string[];
        onImport: () => Promise<void>;
        onPatch: (users: PatchUserRequest[]) => Promise<void>;
        onCheckUsers: (users: PatchUserRequest[]) => Promise<void>;
        onClose: () => void;
    }

    let { open = $bindable(), missingUsers, onImport, onPatch, onCheckUsers, onClose }: Props = $props();

    let userActionType: 'import' | 'patch' = $state('import');
    let patchUserInput = $state('');

    function parseBulkUsers(input: string): PatchUserRequest[] {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: PatchUserRequest[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(',').map(part => part.trim());
            if (parts.length >= 1) {
                users.push({
                    user: parts[0],
                    team: parts.length >= 2 ? parts[1] : undefined
                });
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
        
        await onPatch(users);
        open = false;
        patchUserInput = '';
    }

    async function handleCheckUsers() {
        const users = parseBulkUsers(patchUserInput);
        if (users.length === 0) return;
        
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
                Import missing users in BATCHuser format into Ludus or patch existing users in the pool definition.
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
                            <div class="text-sm font-medium">Users and Teams</div>
                            <p class="text-xs text-muted-foreground">
                                Enter one per line "Username, Team" or "Username"
                            </p>
                            <textarea
                                bind:value={patchUserInput}
                                placeholder="Alice Dan, smurfs&#10;Bob Dylan, gargamel&#10;Dave Smith, smurfs"
                                class="w-full h-48 px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                            ></textarea>
                            {#if patchUserInput.trim()}
                                <p class="text-xs text-muted-foreground">
                                    {parseBulkUsers(patchUserInput).length} user(s) parsed
                                </p>
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
