<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as Card from '$lib/components/ui/card';
    import * as Alert from '$lib/components/ui/alert';
    import { Badge } from '$lib/components/ui/badge';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { AlertCircle, CheckCircle2, X, RotateCcw, Check, ChevronsUpDown, Save, Users, Search } from 'lucide-svelte';
    import { tick } from 'svelte';
    import type { PageData } from './$types';
    import { createPool, type PoolRequest, type PoolUserAndTeam, checkUsersInTopologies } from '$lib/api/pools.client';
    import { dulusApiKey } from '$lib/api/settings';
    import { goto } from '$app/navigation';

    let { data }: { data: PageData } = $props();

    // Pool type options
    type PoolType = 'INDIVIDUAL' | 'SHARED';

    // Form state
    interface PoolFormData {
        type: PoolType | null;
        topologyId: string;
        topologyName: string;
        mainUser: string;
        mainUserName: string;
        bulkUserInput: string; // For pasting multiple users
        note: string;
    }

    let formData: PoolFormData = $state({
        type: null,
        topologyId: "",
        topologyName: "",
        mainUser: "",
        mainUserName: "",
        bulkUserInput: "",
        note: ""
    });    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);

    // Combobox state
    let topologyOpen = $state(false);
    let mainUserOpen = $state(false);
    let topologyTriggerRef = $state<HTMLButtonElement>(null!);
    let mainUserTriggerRef = $state<HTMLButtonElement>(null!);

    // Transform data for combobox format
    const topologyOptions = $derived(
        data.topologies.map(topology => ({
            value: topology.ID,
            label: topology.Name,
            description: `ID: ${topology.ID}`
        }))
    );

    const userOptions = $derived(
        getFilteredUsers().map(user => ({
            value: user.userID,
            label: user.name,
            description: `ID: ${user.userID}`
        }))
    );

    // Selected values for comboboxes
    const selectedTopology = $derived(
        topologyOptions.find((t) => t.value === formData.topologyId)?.label
    );

    const selectedMainUser = $derived(
        userOptions.find((u) => u.value === formData.mainUser)?.label
    );

    // Extract createdBy from dulusApiKey (first part until dot)
    const createdBy = dulusApiKey.split('.')[0];

    // Filter users based on pool type
    function getFilteredUsers() {
        return data.users;
    }

    function handleTypeChange(type: PoolType) {
        formData.type = type;
        // Reset dependent fields when type changes
        formData.mainUser = '';
        formData.mainUserName = '';
        formData.bulkUserInput = '';
    }

    function handleTopologyChange(value: string) {
        formData.topologyId = value;
        const topology = data.topologies.find(t => t.ID === value);
        formData.topologyName = topology?.Name || '';
    }

    // Combobox helper functions
    function closeAndFocusTopologyTrigger() {
        topologyOpen = false;
        tick().then(() => {
            topologyTriggerRef?.focus();
        });
    }

    function closeAndFocusMainUserTrigger() {
        mainUserOpen = false;
        tick().then(() => {
            mainUserTriggerRef?.focus();
        });
    }

    function handleMainUserChange(value: string) {
        formData.mainUser = value || '';
        const user = data.users.find(u => u.userID === value);
        formData.mainUserName = user?.name || '';
    }

    function resetForm() {
        formData = {
            type: null,
            topologyId: '',
            topologyName: '',
            mainUser: '',
            mainUserName: '',
            bulkUserInput: '',
            note: ''
        };
    }

    function showAlert(type: 'success' | 'error', message: string) {
        console.log('Showing alert:', type, message); // Debug log
        alertMessage = { type, message };
        setTimeout(() => {
            alertMessage = null;
        }, 10000); // Increased from 5000 to 10000 (10 seconds)
    }

    function hideAlert() {
        alertMessage = null;
    }

    function navigateToUsers() {
        goto('/users');
    }

    // Transform user name to userId format (BATCH + lowercase no spaces)
    function transformToUserId(userName: string): string {
        return 'BATCH' + userName.toLowerCase().replace(/\s+/g, '');
    }

    async function checkUsersInOtherPools() {
        console.log('checkUsersInOtherPools called'); // Debug log
        
        if (!formData.bulkUserInput.trim()) {
            console.log('No bulk user input'); // Debug log
            showAlert('error', 'Please enter users first');
            return;
        }

        const users = parseBulkUsers(formData.bulkUserInput);
        console.log('Parsed users:', users); // Debug log
        
        if (users.length === 0) {
            console.log('No users parsed'); // Debug log
            showAlert('error', 'No valid users found in input');
            return;
        }

        // Validate before sending request
        // Check for duplicate users in the bulk input
        const userNames = users.map(u => u.user.toLowerCase().trim());
        const uniqueUserNames = new Set(userNames);
        if (userNames.length !== uniqueUserNames.size) {
            showAlert('error', 'Duplicate users found in the user list. Please remove duplicates before checking.');
            return;
        }

        // For SHARED pools, ensure main user is not in the additional users list
        if (formData.type === 'SHARED' && formData.mainUser) {
            // Convert user names to IDs for proper comparison
            const additionalUserIds = users.map(u => transformToUserId(u.user));
            if (additionalUserIds.includes(formData.mainUser)) {
                showAlert('error', 'Main user cannot be included in the additional users list');
                return;
            }
        }

        try {
            // Transform user names to userId format
            let userIds = users.map(u => transformToUserId(u.user));
            console.log('User IDs to check:', userIds); // Debug log
            
            // For SHARED pools, also include the main user ID
            if (formData.type === 'SHARED' && formData.mainUser) {
                userIds.push(formData.mainUser);
                console.log('Added main user, final userIds:', userIds); // Debug log
            }
            
            console.log('Making API call...'); // Debug log
            const results = await checkUsersInTopologies(userIds);
            console.log('API results:', results); // Debug log
            
            const existingUsers = results.filter(r => r.exists);
            if (existingUsers.length > 0) {
                const userList = existingUsers.map(u => u.userId).join(', ');
                console.log('Found existing users:', userList); // Debug log
                showAlert('error', `Users already in other pools:\n${userList}`);
            } else {
                console.log('All users available'); // Debug log
                showAlert('success', 'All users are available for use');
            }
        } catch (error: any) {
            console.error('Error checking users:', error);
            showAlert('error', 'Failed to check users in pools');
        }
    }

    // Parse bulk user input - team is optional
    function parseBulkUsers(input: string): PoolUserAndTeam[] {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: PoolUserAndTeam[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(',').map(part => part.trim());
            if (parts.length >= 1) {
                users.push({
                    user: parts[0],
                    team: parts.length >= 2 ? parts[1] : ""
                });
            }
        }
        
        return users;
    }

    function handleSubmit() {
        // Only validate team assignment rule (specific business logic not in isFormValid)
        if (formData.type === 'INDIVIDUAL' || formData.type === 'SHARED') {
            const users = parseBulkUsers(formData.bulkUserInput);
            const hasAnyTeam = users.some((user: PoolUserAndTeam) => user.team);
            const hasAllTeams = users.every((user: PoolUserAndTeam) => user.team);
            
            if (hasAnyTeam && !hasAllTeams) {
                showAlert('error', 'If one user has a team, all users must have teams assigned');
                return;
            }

            // Check for duplicate users in the bulk input
            const userNames = users.map(u => u.user.toLowerCase().trim());
            const uniqueUserNames = new Set(userNames);
            if (userNames.length !== uniqueUserNames.size) {
                showAlert('error', 'Duplicate users found in the user list. Each user should only appear once.');
                return;
            }

            // For SHARED pools, ensure main user is not in the additional users list
            if (formData.type === 'SHARED' && formData.mainUser) {
                // Convert user names to IDs for proper comparison
                const additionalUserIds = users.map(u => transformToUserId(u.user));
                if (additionalUserIds.includes(formData.mainUser)) {
                    showAlert('error', 'Main user cannot be included in the additional users list');
                    return;
                }
            }
        }

        submitPool();
    }

    async function submitPool() {
        try {
            let poolData: PoolRequest = {
                type: formData.type!,
                topologyId: formData.topologyId,
                note: formData.note.trim() // Note is now required, no undefined
            };

            if (formData.type === 'INDIVIDUAL') {
                const usersAndTeams = parseBulkUsers(formData.bulkUserInput);
                if (usersAndTeams.length === 0) {
                    showAlert('error', 'No valid users found in input');
                    return;
                }
                poolData.usersAndTeams = usersAndTeams;
                if (usersAndTeams.length > 0) {
                    poolData.mainUser = usersAndTeams[0].user;
                }
            } else if (formData.type === 'SHARED') {
                poolData.mainUser = formData.mainUser;
                const additionalUsers = parseBulkUsers(formData.bulkUserInput);
                if (additionalUsers.length > 0) {
                    // Double-check: ensure main user is not in the additional users list
                    const additionalUserIds = additionalUsers.map(u => transformToUserId(u.user));
                    
                    if (additionalUserIds.includes(formData.mainUser)) {
                        showAlert('error', 'Main user cannot be included in the additional users list');
                        return;
                    }
                    
                    poolData.usersAndTeams = additionalUsers;
                }
            }

            await createPool(poolData);
            showAlert('success', `${formData.type} pool created successfully!`);
            
            // Clear form after successful submission
            resetForm();
        } catch (error: any) {
            console.error('Error creating pool:', error);
            
            // Try to extract detailed error message from API response
            let errorMessage = 'Failed to create pool';
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Handle structured error response with results array
                if (responseData.results && Array.isArray(responseData.results)) {
                    const errors = responseData.results
                        .filter((result: any) => result.response?.error)
                        .map((result: any) => `${result.userId}: ${result.response.error}`)
                        .join('\n');
                    
                    if (errors) {
                        errorMessage = `Pool creation errors:\n${errors}`;
                    }
                } else if (responseData.error) {
                    // Handle simple error response
                    errorMessage = responseData.error;
                } else if (typeof responseData === 'string') {
                    // Handle plain text error
                    errorMessage = responseData;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            showAlert('error', errorMessage);
        }
    }

    function isFormValid(): boolean {
        if (!formData.type || !formData.topologyId) {
            return false;
        }
        
        if (!formData.note.trim()) {
            return false;
        }
        
        if (formData.note.length > 15) {
            return false;
        }
        
        if (formData.type === 'INDIVIDUAL') {
            return formData.bulkUserInput.trim().length > 0;
        }
        
        if (formData.type === 'SHARED') {
            return formData.mainUser.length > 0;
        }
        
        return false;
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Create Pool</h1>
            <p class="text-sm text-muted-foreground">
                Configure and deploy a new training pool
            </p>
        </div>
        <Button variant="outline" onclick={resetForm} class="flex items-center gap-2">
            <RotateCcw class="h-4 w-4" />
            Reset Form
        </Button>
    </div>

    <!-- Floating Alert Messages -->
    {#if alertMessage}
        <div class="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl animate-in slide-in-from-top-2">
            <Alert.Root variant={alertMessage.type === 'error' ? 'destructive' : 'default'} class="shadow-lg border">
                {#if alertMessage.type === 'error'}
                    <AlertCircle class="h-4 w-4" />
                {:else}
                    <CheckCircle2 class="h-4 w-4" />
                {/if}
                <Alert.Title class="text-sm font-medium">
                    {alertMessage.type === 'error' ? 'Error' : 'Success'}
                </Alert.Title>
                <Alert.Description class="text-sm flex items-start justify-between pr-2">
                    <pre class="whitespace-pre-wrap text-wrap break-words text-sm font-mono max-w-full">{alertMessage.message}</pre>
                    <Button variant="ghost" size="sm" onclick={hideAlert} class="h-6 w-6 p-0 ml-2 flex-shrink-0">
                        <X class="h-3 w-3" />
                    </Button>
                </Alert.Description>
            </Alert.Root>
        </div>
    {/if}
    
    <br>
    <div class="flex-1 min-h-0 w-full overflow-auto pb-20">
        <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-[600px]">
                <!-- Step 1: Pool Type Selection -->
                <Card.Root class="h-fit">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 1: Select Pool Type</Card.Title>
                        <Card.Description class="text-base">Choose the type of pool you want to create</Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-4 p-6">
                        <button
                            class="w-full p-6 border-2 rounded-lg transition-all {formData.type === 'INDIVIDUAL' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                            onclick={() => handleTypeChange('INDIVIDUAL')}
                        >
                            <div class="text-center">
                                <h3 class="font-semibold mb-2 text-lg">Individual</h3>
                                <p class="text-sm text-muted-foreground">One pool per user</p>
                                {#if formData.type === 'INDIVIDUAL'}
                                    <Badge class="mt-3">Selected</Badge>
                                {/if}
                            </div>
                        </button>

                        <button
                            class="w-full p-6 border-2 rounded-lg transition-all {formData.type === 'SHARED' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                            onclick={() => handleTypeChange('SHARED')}
                        >
                            <div class="text-center">
                                <h3 class="font-semibold mb-2 text-lg">Shared</h3>
                                <p class="text-sm text-muted-foreground">Multi-user shared pool</p>
                                {#if formData.type === 'SHARED'}
                                    <Badge class="mt-3">Selected</Badge>
                                {/if}
                            </div>
                        </button>

                        <!-- Manage Users Button - always shown -->
                        <div class="mt-6">
                            <Button 
                                variant="outline" 
                                onclick={navigateToUsers}
                                class="w-full flex items-center gap-2"
                            >
                                <Users class="h-4 w-4" />
                                Manage Users
                            </Button>
                        </div>
                    </Card.Content>
                </Card.Root>

                <!-- Step 2: Set up users -->
                <Card.Root class="h-fit {!formData.type ? 'opacity-50 pointer-events-none' : ''}">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 2: Select users</Card.Title>
                        <Card.Description class="text-base">
                            {#if formData.type === 'INDIVIDUAL'}
                                Enter users and teams for individual pools
                            {:else if formData.type === 'SHARED'}
                                Select main user and additional users
                            {:else}
                                Select a pool type first
                            {/if}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-6 p-6">
                        <!-- Users and Teams Input (always first when applicable) -->
                        {#if formData.type === 'INDIVIDUAL' || formData.type === 'SHARED'}
                            <div class="space-y-3">
                                <div class="text-sm font-medium">
                                    {formData.type === 'INDIVIDUAL' ? 'Users and Teams *' : 'Additional Users and Teams'}
                                </div>
                                <p class="text-xs text-muted-foreground">
                                    Enter one per line "Username, Team" or "Username"
                                </p>
                                <textarea
                                    bind:value={formData.bulkUserInput}
                                    placeholder="Alice Dan, smurfs
Bob Dylan, gargamel
Dave Smith, smurfs"
                                    class="w-full h-48 px-4 py-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                                ></textarea>
                                {#if formData.bulkUserInput.trim()}
                                    <p class="text-xs text-muted-foreground">
                                        {parseBulkUsers(formData.bulkUserInput).length} user(s) parsed
                                    </p>
                                {/if}
                            </div>
                        {/if}

                        <!-- Main User Selection (underneath users and teams) -->
                        {#if formData.type === 'SHARED'}
                            <div class="space-y-3">
                                <div class="text-sm font-medium">Main User *</div>
                                <Popover.Root bind:open={mainUserOpen}>
                                    <Popover.Trigger bind:ref={mainUserTriggerRef}>
                                        {#snippet child({ props })}
                                            <Button
                                                {...props}
                                                variant="outline"
                                                class="w-full justify-between"
                                                role="combobox"
                                                aria-expanded={mainUserOpen}
                                            >
                                                {selectedMainUser || "Select main user..."}
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
                                                            value={user.value}
                                                            onSelect={() => {
                                                                handleMainUserChange(user.value);
                                                                closeAndFocusMainUserTrigger();
                                                            }}
                                                        >
                                                            <Check
                                                                class="mr-2 h-4 w-4 {formData.mainUser !== user.value && 'text-transparent'}"
                                                            />
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
                        {/if}

                        <!-- Check Users in Pools Button -->
                        {#if formData.type === 'INDIVIDUAL' || formData.type === 'SHARED'}
                            <div class="mt-6 pt-6 border-t">
                                <Button 
                                    variant="outline" 
                                    onclick={checkUsersInOtherPools}
                                    disabled={!formData.bulkUserInput.trim() || (formData.type === 'SHARED' && !formData.mainUser)}
                                    class="w-full flex items-center gap-2"
                                >
                                    <Search class="h-4 w-4" />
                                    Check Users in Pools
                                </Button>
                            </div>
                        {/if}
                    </Card.Content>
                </Card.Root>

                <!-- Step 3: Select Topology & Note -->
                <Card.Root class="h-fit {!formData.type ? 'opacity-50 pointer-events-none' : ''}">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 3: Topology & Details</Card.Title>
                        <Card.Description class="text-base">
                            {#if formData.type}
                                Choose the topology and add notes for your pool
                            {:else}
                                Select a pool type first
                            {/if}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-6 p-6">
                        <div class="space-y-3">
                            <div class="text-sm font-medium">Topology *</div>
                            <Popover.Root bind:open={topologyOpen}>
                                <Popover.Trigger bind:ref={topologyTriggerRef}>
                                    {#snippet child({ props })}
                                        <Button
                                            {...props}
                                            variant="outline"
                                            class="w-full justify-between"
                                            role="combobox"
                                            aria-expanded={topologyOpen}
                                        >
                                            {selectedTopology || "Select topology..."}
                                            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    {/snippet}
                                </Popover.Trigger>
                                <Popover.Content class="w-full p-0">
                                    <Command.Root>
                                        <Command.Input placeholder="Search topologies..." />
                                        <Command.List>
                                            <Command.Empty>No topology found.</Command.Empty>
                                            <Command.Group>
                                                {#each topologyOptions as topology (topology.value)}
                                                    <Command.Item
                                                        value={topology.value}
                                                        onSelect={() => {
                                                            handleTopologyChange(topology.value);
                                                            closeAndFocusTopologyTrigger();
                                                        }}
                                                    >
                                                        <Check
                                                            class="mr-2 h-4 w-4 {formData.topologyId !== topology.value && 'text-transparent'}"
                                                        />
                                                        <div class="flex flex-col">
                                                            <span>{topology.label}</span>
                                                            {#if topology.description}
                                                                <span class="text-xs text-muted-foreground">{topology.description}</span>
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

                        <div class="space-y-3">
                            <div class="text-sm font-medium">Note * <span class="text-muted-foreground">(required, max 15 chars)</span></div>
                            <Input
                                bind:value={formData.note}
                                placeholder="Enter note..."
                                maxlength={15}
                                class="w-full"
                            />
                            <p class="text-xs text-muted-foreground">
                                {formData.note.length}/15 characters
                            </p>
                        </div>

                        <div class="space-y-3">
                            <div class="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                <strong>Created by:</strong> {createdBy}
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>
            </div>
        </div>
    </div>

    <!-- Floating Save Button -->
    <div class="fixed bottom-6 right-6 z-50">
        <Button
            onclick={handleSubmit}
            disabled={!isFormValid()}
            size="lg"
            class="h-16 px-8 text-lg font-semibold shadow-2xl"
        >
            <Save class="h-4 w-4" />
            Save Pool
        </Button>
    </div>
</div>
