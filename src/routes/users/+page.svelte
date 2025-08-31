<script lang="ts">
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Select from '$lib/components/ui/select';
    import { Input } from '$lib/components/ui/input';
    import { AlertCircle, CheckCircle2, X, Trash2, Users, Plus, UserPlus } from 'lucide-svelte';
    import type { User } from './data.js';
    import { downloadWireGuardConfig, deleteUser, deleteMultipleUsers, createUser } from './data.js';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);
    let deleteDialogOpen = $state(false);
    let massDeleteDialogOpen = $state(false);
    let addUserDialogOpen = $state(false);
    let userToDelete = $state<User | null>(null);
    let selectedUsersForDelete = $state<string[]>([]);
    let newUserName = $state('');

    // Filter out root users
    const filteredUsers = $derived(data.users.filter(user => user.name.toLowerCase() !== 'root'));

    const headers: { key: keyof User; label: string; sortable?: boolean }[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'isAdmin', label: 'Admin', sortable: true },
        { key: 'dateCreated', label: 'Created', sortable: true }
    ];

    async function handleDownload(user: User) {
        try {
            await downloadWireGuardConfig(user.userID);
            showAlert('success', `WireGuard config for "${user.name}" downloaded successfully`);
        } catch (error) {
            showAlert('error', 'Failed to download WireGuard configuration');
        }
    }

    function handleDeleteUser(user: User) {
        userToDelete = user;
        deleteDialogOpen = true;
    }

    async function confirmDeleteUser() {
        if (!userToDelete) return;
        
        // Store user info before clearing
        const userName = userToDelete.name;
        const userId = userToDelete.userID;
        
        // Close dialog immediately
        deleteDialogOpen = false;
        userToDelete = null;
        
        // Show initial deleting notification
        showAlert('success', `Deleting user "${userName}"`);
        
        try {
            await deleteUser(userId);
            showAlert('success', `User "${userName}" deleted successfully`);
            // Wait a moment for user to see the success message before refreshing
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showAlert('error', `User "${userName}" deleted with errors (may still be processing)`);
            // Still refresh after a delay in case the deletion actually worked
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

    function handleMassDelete() {
        selectedUsersForDelete = [];
        massDeleteDialogOpen = true;
    }

    function toggleUserForDelete(userID: string) {
        if (selectedUsersForDelete.includes(userID)) {
            selectedUsersForDelete = selectedUsersForDelete.filter(id => id !== userID);
        } else {
            selectedUsersForDelete = [...selectedUsersForDelete, userID];
        }
    }

    function handleAddUser() {
        newUserName = '';
        addUserDialogOpen = true;
    }

    async function confirmAddUser() {
        if (!newUserName.trim()) {
            showAlert('error', 'Please enter a username');
            return;
        }
        
        // Store values before clearing
        const userName = newUserName.trim();
        
        // Close dialog immediately
        addUserDialogOpen = false;
        newUserName = '';
        
        // Show loading notification
        showAlert('success', 'Creating user');
        
        try {
            await createUser(userName, false); // Always create regular user (not admin)
            showAlert('success', `User "${userName}" created successfully`);
            // Wait a moment for user to see the success message before refreshing
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showAlert('error', `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async function confirmMassDelete() {
        if (selectedUsersForDelete.length === 0) return;
        
        // Store values before clearing
        const userCount = selectedUsersForDelete.length;
        const userIds = [...selectedUsersForDelete];
        
        // Close dialog immediately
        massDeleteDialogOpen = false;
        selectedUsersForDelete = [];
        
        // Show initial deleting notification
        showAlert('success', `Deleting ${userCount} user${userCount !== 1 ? 's' : ''}`);
        
        try {
            await deleteMultipleUsers(userIds);
            showAlert('success', `${userCount} user${userCount !== 1 ? 's' : ''} deleted successfully`);
            // Wait a moment for user to see the success message before refreshing
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showAlert('error', `${userCount} user${userCount !== 1 ? 's' : ''} deleted with errors (may still be processing)`);
            // Still refresh after a delay in case the deletion actually worked
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

    function showAlert(type: 'success' | 'error', message: string) {
        alertMessage = { type, message };
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Users</h1>
            <p class="text-sm text-muted-foreground">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button 
                onclick={handleAddUser}
                class="flex items-center gap-2"
            >
            <Plus class="h-4 w-4" />
                Add User
            </Button>
            <Button 
                onclick={handleMassDelete}
                variant="outline"
                class="flex items-center gap-2"
            >
                <Trash2 class="h-4 w-4" />
                Delete Users
            </Button>
        </div>
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
            data={filteredUsers} 
            {headers} 
            maxHeight="calc(100% - 2rem)"
            showActions={true}
            onDownloadWireguard={handleDownload}
            onDelete={handleDeleteUser}
            showDeleteFor={(user) => !user.isAdmin}
        />
    </div>

    <!-- Delete User Dialog -->
    <Dialog.Root bind:open={deleteDialogOpen}>
        <Dialog.Content class="max-w-md">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Trash2 class="h-5 w-5" />
                    Delete User
                </Dialog.Title>
                <Dialog.Description>
                    Are you sure you want to delete this user? This action cannot be undone.
                </Dialog.Description>
            </Dialog.Header>
            
            {#if userToDelete}
                <div class="py-4">
                    <div class="p-3 bg-muted/50 border border-input rounded-lg">
                        <p class="text-sm font-medium">
                            User: {userToDelete.name}
                        </p>
                        <p class="text-xs text-muted-foreground mt-1">
                            ID: {userToDelete.userID}
                        </p>
                    </div>
                </div>
            {/if}

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => deleteDialogOpen = false}>
                    Cancel
                </Button>
                <Button onclick={confirmDeleteUser}>
                    Delete
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Mass Delete Dialog -->
    <Dialog.Root bind:open={massDeleteDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <Users class="h-5 w-5" />
                    Mass Delete Users
                </Dialog.Title>
                <Dialog.Description>
                    Select the users you want to delete. This action cannot be undone.
                </Dialog.Description>
            </Dialog.Header>
            
            <div class="max-h-64 overflow-y-auto border rounded-lg">
                {#each filteredUsers as user}
                    <div class="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50">
                        <input
                            type="checkbox"
                            id="user-{user.userID}"
                            checked={selectedUsersForDelete.includes(user.userID)}
                            onchange={() => toggleUserForDelete(user.userID)}
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label for="user-{user.userID}" class="flex-1 cursor-pointer">
                            <div class="font-medium">{user.name}</div>
                            <div class="text-xs text-muted-foreground">ID: {user.userID}</div>
                        </label>
                        {#if user.isAdmin}
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                Admin
                            </span>
                        {/if}
                    </div>
                {/each}
            </div>

            {#if selectedUsersForDelete.length >= 0}
                <div class="p-3 bg-muted/50 border border-input rounded-lg">
                    <p class="text-sm font-medium">
                        {selectedUsersForDelete.length} user{selectedUsersForDelete.length !== 1 ? 's' : ''} selected for deletion
                    </p>
                </div>
            {:else}
                <div class="p-3 bg-muted/50 border border-input rounded-lg opacity-0 pointer-events-none">
                    <p class="text-sm font-medium">
                        0 users selected for deletion
                    </p>
                </div>
            {/if}

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => massDeleteDialogOpen = false}>
                    Cancel
                </Button>
                <Button 
                    onclick={confirmMassDelete}
                    disabled={selectedUsersForDelete.length === 0}
                >
                    Delete
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Add User Dialog -->
    <Dialog.Root bind:open={addUserDialogOpen}>
        <Dialog.Content class="max-w-md">
            <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                    <UserPlus class="h-5 w-5" />
                    Add New User
                </Dialog.Title>
                <Dialog.Description>
                    Create a new user account. Choose whether they should have admin privileges.
                </Dialog.Description>
            </Dialog.Header>

            <div class="space-y-4">
                <div class="space-y-2">
                    <label for="username" class="text-sm font-medium">Username</label>
                    <Input
                        id="username"
                        bind:value={newUserName}
                        placeholder="Enter username"
                        class="w-full"
                    />
                </div>
            </div>

            <Dialog.Footer class="gap-2">
                <Button variant="outline" onclick={() => addUserDialogOpen = false}>
                    Cancel
                </Button>
                <Button 
                    onclick={confirmAddUser}
                    disabled={!newUserName.trim()}
                >
                    Create User
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
</div>
