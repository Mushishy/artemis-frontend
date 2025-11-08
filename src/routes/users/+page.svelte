<script lang="ts">
    import { DataTable } from '$lib/components/ui/data-table';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Input } from '$lib/components/ui/input';
    import { AlertCircle, CheckCircle2, X, Trash2, Users, Plus, UserPlus, Search, Share } from 'lucide-svelte';
    import type { User } from '$lib/api/types';
    import { downloadWireGuardConfig, deleteUser, deleteMultipleUsers, createUser } from '$lib/api/client/users.client';
    import { checkUsersInPools } from '$lib/api/client/pools.client';
    import SharePoolDialog from '$lib/components/pool/SharePoolDialog.svelte';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);
    let deleteDialogOpen = $state(false);
    let massDeleteDialogOpen = $state(false);
    let addUserDialogOpen = $state(false);
    let sharePoolDialogOpen = $state(false);
    let userToDelete = $state<User | null>(null);
    let selectedUsersForDelete = $state<string[]>([]);
    let newUserName = $state('');
    let isCheckingUsers = $state(false);

    // TABLE
    // Filter out root user
    const filteredUsers = $derived(data.users.filter(user => 
        user.name.toLowerCase() !== 'root'
    ));

    // Filter out admin users for mass delete selection
    const nonAdminUsers = $derived(filteredUsers.filter(user => !user.isAdmin));

    const headers: { key: keyof User; label: string; sortable?: boolean }[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'isAdmin', label: 'Admin', sortable: true },
        { key: 'dateCreated', label: 'Created', sortable: true }
    ];

    // Action Function
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
        
        const userName = userToDelete.name;
        const userId = userToDelete.userID;
        
        deleteDialogOpen = false;
        userToDelete = null;
        
        showAlert('success', `Deleting user "${userName}"`);
        
        try {
            await deleteUser(userId);
            showAlert('success', `User "${userName}" deleted successfully`);
            setTimeout(() => window.location.href = window.location.pathname, 1500);
        } catch (error: any) {
            // Check for 500 error (user has active range)
            if (error.response?.status === 500) {
                showAlert('error', `User "${userName}" cannot be deleted because they have an active range`);
            } else {
                showAlert('error', `User "${userName}" deleted with errors (may still be processing)`);
                setTimeout(() => window.location.href = window.location.pathname, 3000);
            }
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

    function handleSharePool() {
        sharePoolDialogOpen = true;
    }

    async function handleCheckUsersInPools() {
        if (selectedUsersForDelete.length === 0) {
            showAlert('error', 'Please select users to check');
            return;
        }

        isCheckingUsers = true;
        
        try {
            const results = await checkUsersInPools(selectedUsersForDelete);
            const usersInPools = results.filter(result => result.exists);
            const usersAvailable = results.filter(result => !result.exists);

            if (usersInPools.length > 0) {
                const userNames = usersInPools.map(result => {
                    const user = nonAdminUsers.find(u => u.userID === result.userId);
                    return user?.name || result.userId;
                }).join(', ');
                showAlert('error', `Users in pools: ${userNames}`);
            }

            if (usersAvailable.length > 0) {
                const userNames = usersAvailable.map(result => {
                    const user = nonAdminUsers.find(u => u.userID === result.userId);
                    return user?.name || result.userId;
                }).join(', ');
                showAlert('success', `Users available for deletion: ${userNames}`);
            }
        } catch (error) {
            showAlert('error', `Failed to check users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            isCheckingUsers = false;
        }
    }

    async function confirmAddUser() {
        if (!newUserName.trim()) {
            showAlert('error', 'Please enter a username');
            return;
        }
        
        const userName = newUserName.trim();
        
        // Validate username
        if (userName.length >= 20) {
            showAlert('error', 'Username must be less than 20 characters');
            return;
        }
        
        // Check for only basic ASCII alphanumeric characters
        const validUsernameRegex = /^[a-zA-Z0-9]+$/;
        if (!validUsernameRegex.test(userName)) {
            showAlert('error', 'Username can only contain basic ASCII letters (a-z, A-Z) and numbers (0-9). No spaces, special characters, or diacritical marks allowed.');
            return;
        }
        
        addUserDialogOpen = false;
        newUserName = '';
        
        showAlert('success', `Creating user "${userName}"`);
        
        try {
            await createUser(userName, false);
            showAlert('success', `User "${userName}" created successfully`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            let errorMessage = 'Unknown error occurred';
            
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showAlert('error', `Failed to create user: ${errorMessage}`);
        }
    }

    async function confirmMassDelete() {
        if (selectedUsersForDelete.length === 0) return;
        
        const userCount = selectedUsersForDelete.length;
        const userIds = [...selectedUsersForDelete];
        
        massDeleteDialogOpen = false;
        selectedUsersForDelete = [];
        
        showAlert('success', `Deleting ${userCount} user${userCount !== 1 ? 's' : ''}`);
        
        try {
            await deleteMultipleUsers(userIds);
            showAlert('success', `${userCount} user${userCount !== 1 ? 's' : ''} deleted successfully`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            showAlert('error', `${userCount} user${userCount !== 1 ? 's' : ''} deleted with errors (may still be processing)`);
            setTimeout(() => window.location.reload(), 3000);
        }
    }

    function showAlert(type: 'success' | 'error', message: string) {
        alertMessage = { type, message };
        setTimeout(() => alertMessage = null, 10000);
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
                onclick={handleMassDelete}
                variant="outline"
                class="flex items-center gap-2"
            >
            <Trash2 class="h-4 w-4" />
                Delete Users
            </Button>
            <Button 
                onclick={handleSharePool}
                variant="outline"
                class="flex items-center gap-2"
            >
            <Share class="h-4 w-4" />
                Share Pool
            </Button>
            <Button 
                onclick={handleAddUser}
                class="flex items-center gap-2"
            >
            <Plus class="h-4 w-4" />
                Add User
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
                {#each nonAdminUsers as user}
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
                    </div>
                {/each}
            </div>

            {#if selectedUsersForDelete.length > 0}
                <div class="p-3 bg-muted/50 border border-input rounded-lg">
                    <p class="text-sm font-medium">
                        {selectedUsersForDelete.length} user{selectedUsersForDelete.length !== 1 ? 's' : ''} selected for deletion
                    </p>
                </div>
            {/if}

            <Dialog.Footer class="gap-2">
                <Button 
                    onclick={handleCheckUsersInPools}
                    variant="outline"
                    disabled={isCheckingUsers || selectedUsersForDelete.length === 0}
                    class="flex items-center gap-2"
                >
                    <Search class="h-4 w-4" />
                        Check Users in Pools
                </Button>
                <div class="flex-1"></div>
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
                    Create a new user account.
                </Dialog.Description>
            </Dialog.Header>

            <div class="space-y-4">
                <div class="space-y-2">
                    <label for="username" class="text-sm font-medium">Username</label>
                    <p class="text-xs text-muted-foreground">If you want to create BATCHuser, you have to input the whole name</p>
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

    <!-- Share Pool Dialog -->
    <SharePoolDialog 
        bind:open={sharePoolDialogOpen}
        onClose={() => sharePoolDialogOpen = false}
        onShowAlert={(message, type) => showAlert(type, message)}
    />
</div>
