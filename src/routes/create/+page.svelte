<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as Card from '$lib/components/ui/card';
    import * as Alert from '$lib/components/ui/alert';
    import { Badge } from '$lib/components/ui/badge';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import * as Dialog from '$lib/components/ui/dialog';
    import { AlertCircle, CheckCircle2, X, RotateCcw, Check, ChevronsUpDown, Save, Users, Search, UserCheck } from 'lucide-svelte';
    import { tick } from 'svelte';
    import type { PageData } from './$types';
    import { createPool, checkUsersInPools } from '$lib/api/client/pools.client';
    import { getMainUsers } from '$lib/api/client/users.client';
    import type { PoolRequest, PoolUserAndTeam, PoolUserTeam } from '$lib/api/types';
    import { userStore } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { normalizeText } from '$lib/utils/helper';

    let { data }: { data: PageData } = $props();

    // Pool type options
    type PoolType = 'INDIVIDUAL' | 'SHARED';

    // Form state
    type PoolFormData = {
        type: PoolType | null
        topologyId: string
        topologyName: string
        bulkUserInput: string
        note: string
    }
    
    let formData: PoolFormData = $state({
        type: null,
        topologyId: "",
        topologyName: "",
        bulkUserInput: "",
        note: ""
    });

    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);

    // Combobox state
    let topologyOpen = $state(false);
    let topologyTriggerRef = $state<HTMLButtonElement>(null!);
    let mainUsersOpen = $state(false);
    let mainUsersTriggerRef = $state<HTMLButtonElement>(null!);
    let mainUsersData = $state<string[]>([]);



    // Transform data for combobox format
    const topologyOptions = $derived(
        data.topologies.map(topology => ({
            value: topology.ID,
            label: topology.Name,
            description: `ID: ${topology.ID}`
        }))
    );

    const mainUsersOptions = $derived(
        mainUsersData.map(userId => ({
            value: userId,
            label: userId,
            description: `Main User: ${userId}`
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



    // Extract createdBy from user store
    let createdBy = $state('Unknown');
    
    // Update createdBy when user changes
    $effect(() => {
        createdBy = $userStore?.username || 'Unknown';
    });

    // Load main users data on component mount
    $effect(() => {
        async function loadMainUsersData() {
            try {
                const result = await getMainUsers();
                mainUsersData = result.userIds;
            } catch (error) {
                console.error('Failed to load main users:', error);
                mainUsersData = [];
            }
        }
        loadMainUsersData();
    });

    // Filter users based on pool type
    function getFilteredUsers() {
        return data.users;
    }

    function handleTypeChange(type: PoolType) {
        formData.type = type;
        // Reset dependent fields when type changes
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

    function closeAndFocusMainUsersTrigger() {
        mainUsersOpen = false;
        tick().then(() => {
            mainUsersTriggerRef?.focus();
        });
    }



    function resetForm() {
        formData = {
            type: null,
            topologyId: '',
            topologyName: '',
            bulkUserInput: '',
            note: ''
        };
    }

    function showAlert(type: 'success' | 'error', message: string) {
        alertMessage = { type, message };
        setTimeout(() => {
            alertMessage = null;
        }, 10000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function navigateToUsers() {
        goto('/users');
    }

    // Transform user name to userId format (BATCH + normalized lowercase no spaces)
    function transformToUserId(userName: string): string {
        return 'BATCH' + normalizeText(userName).replace(/\s+/g, '');
    }

    // Validate user names to ensure they don't exceed 25 characters when combined with BATCH
    function validateUserNameLengths(users: PoolUserAndTeam[]): string | null {
        const invalidUsers = users.filter(user => {
            const userId = transformToUserId(user.user);
            return userId.length > 20;
        });

        if (invalidUsers.length > 0) {
            const userList = invalidUsers.map(u => `"${u.user}"`).join('\n ');
            return `User names too long when combined with BATCH prefix. Maximum 25 characters total. Invalid users:\n ${userList}`;
        }

        return null;
    }

    async function checkUsersInOtherPools() {
        if (!formData.bulkUserInput.trim()) {
            showAlert('error', 'Please enter users first');
            return;
        }

        const users = parseBulkUsers(formData.bulkUserInput);
        
        if (users.length === 0) {
            showAlert('error', 'No valid users found in input.');
            return;
        }

        // For SHARED pools, validate that all users have mainUserId
        if (formData.type === 'SHARED') {
            const usersWithoutMainUserId = users.filter(u => !u.mainUserId.trim());
            if (usersWithoutMainUserId.length > 0) {
                showAlert('error', 'MainUserId is mandatory for all users in SHARED pools. Please check your input format.');
                return;
            }
            
            // Validate that all mainUserIds are valid (exist in mainUsersData)
            const invalidMainUsers = users.filter(u => !mainUsersData.includes(u.mainUserId.trim()));
            if (invalidMainUsers.length > 0) {
                const invalidIds = [...new Set(invalidMainUsers.map(u => u.mainUserId))].join(', ');
                showAlert('error', `Invalid MainUserId(s): ${invalidIds}. MainUserId must be one of the available main users.`);
                return;
            }
        }

        // Validate user name lengths
        const lengthError = validateUserNameLengths(users);
        if (lengthError) {
            showAlert('error', lengthError);
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

        try {
            // Transform user names to userId format
            const userIds = users.map(u => transformToUserId(u.user));
            
            // Also collect all unique main user IDs to check
            const mainUserIds = [...new Set(users.map(u => u.mainUserId))];
            const allUserIds = [...userIds, ...mainUserIds];
            
            const results = await checkUsersInPools(allUserIds);
            
            const existingUsers = results.filter(r => r.exists);
            if (existingUsers.length > 0) {
                const userList = existingUsers.map(u => u.userId).join(', ');
                showAlert('error', `Users already in other pools:\n${userList}`);
            } else {
                showAlert('success', 'All users and main users are available for use');
            }

            // Update available users data by reloading main users
            try {
                const result = await getMainUsers();
                mainUsersData = result.userIds;
            } catch (error) {
                console.error('Failed to refresh main users:', error);
            }
        } catch (error: any) {
            showAlert('error', 'Failed to check users in pools');
        }
    }

    // Parse bulk user input - format depends on pool type
    function parseBulkUsers(input: string): PoolUserAndTeam[] {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: PoolUserAndTeam[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(',').map(part => part.trim());
            
            if (formData.type === 'SHARED') {
                // For SHARED: "Username, MainUserId, Team" or "Username, MainUserId"
                if (parts.length >= 2) {
                    users.push({
                        user: parts[0],
                        mainUserId: parts[1],
                        team: parts.length >= 3 ? parts[2] : ""
                    });
                }
            } else {
                // For INDIVIDUAL: "Username, Team" or "Username"
                if (parts.length >= 1) {
                    users.push({
                        user: parts[0],
                        mainUserId: '', // Will be set to userId in submitPool
                        team: parts.length >= 2 ? parts[1] : ""
                    });
                }
            }
        }
        
        return users;
    }

    function handleSubmit() {
        // Only validate team assignment rule (specific business logic not in isFormValid)
        if (formData.type === 'INDIVIDUAL' || formData.type === 'SHARED') {
            const users = parseBulkUsers(formData.bulkUserInput).map(u => ({ ...u, user: normalizeText(u.user) }));
            
            // For SHARED pools, validate that all users have mainUserId
            if (formData.type === 'SHARED') {
                const usersWithoutMainUserId = users.filter(u => !u.mainUserId.trim());
                if (usersWithoutMainUserId.length > 0) {
                    showAlert('error', 'MainUserId is mandatory for all users in SHARED pools. Please check your input format.');
                    return;
                }
                
                // Validate that all mainUserIds are valid (exist in mainUsersData)
                const invalidMainUsers = users.filter(u => !mainUsersData.includes(u.mainUserId.trim()));
                if (invalidMainUsers.length > 0) {
                    const invalidIds = [...new Set(invalidMainUsers.map(u => u.mainUserId))].join(', ');
                    showAlert('error', `Invalid MainUserId(s): ${invalidIds}. MainUserId must be one of the available main users.`);
                    return;
                }
            }
            
            // Validate user name lengths
            const lengthError = validateUserNameLengths(users);
            if (lengthError) {
                showAlert('error', lengthError);
                return;
            }
            
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
        }

        submitPool();
    }

    async function submitPool() {
        try {
            let poolData: PoolRequest = {
                type: formData.type!,
                topologyId: formData.topologyId,
                note: formData.note.trim(), // Note is now required, no undefined
                usersAndTeams: [] // Initialize as empty array
            };

            const allUsers = parseBulkUsers(formData.bulkUserInput).map(u => ({ ...u, user: normalizeText(u.user) }));
            if (allUsers.length === 0) {
                showAlert('error', 'No valid users found in input');
                return;
            }
            
            // Create usersAndTeams array based on pool type
            const usersAndTeams: any[] = allUsers.map(user => {
                if (formData.type === 'INDIVIDUAL') {
                    // For INDIVIDUAL pools, only send user and team (if present)
                    const userObj: any = { user: user.user };
                    if (user.team) {
                        userObj.team = user.team;
                    }
                    return userObj;
                } else {
                    // For SHARED pools, include mainUserId
                    return {
                        user: user.user,
                        userId: transformToUserId(user.user),
                        team: user.team || '',
                        mainUserId: user.mainUserId
                    };
                }
            });
            
            poolData.usersAndTeams = usersAndTeams;

            await createPool(poolData);
            
            // Navigate to pools page after successful creation
            goto('/pools');
        } catch (error: any) {
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
            if (!formData.bulkUserInput.trim()) {
                return false;
            }
            
            const users = parseBulkUsers(formData.bulkUserInput);
            // For SHARED pools, check that all users have mainUserId
            return users.length > 0 && users.every(u => u.mainUserId.trim());
        }
        
        return false;
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Create Pool</h1>
            <p class="text-sm text-muted-foreground">
                Create a pool definition for management of multiple users ranges at once
            </p>
        </div>
        <div class="flex gap-2">
            <Button variant="outline" onclick={resetForm} class="flex items-center gap-2">
                <RotateCcw class="h-4 w-4" />
                Reset Form
            </Button>
            <Button 
                onclick={handleSubmit}
                disabled={!isFormValid()}
                class="flex items-center gap-2"
            >
                <Save class="h-4 w-4" />
                Save Pool
            </Button>
        </div>
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
                    <pre class="whitespace-pre-wrap text-wrap break-words text-sm max-w-full">{alertMessage.message}</pre>
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
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <!-- Step 1: Pool Type Selection -->
                <Card.Root class="h-full min-h-[39rem] flex flex-col">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 1: Select Pool Type</Card.Title>
                        <Card.Description class="text-base">Choose the type of pool you want to create</Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-4 p-6 flex-1 flex flex-col">
                        <div class="flex-1 space-y-4">
                            <button
                                class="w-full p-6 border-2 rounded-lg transition-all min-h-[8.5rem] {formData.type === 'INDIVIDUAL' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                                onclick={() => handleTypeChange('INDIVIDUAL')}
                            >
                                <div class="text-center h-full flex flex-col justify-center">
                                    <h3 class="font-semibold mb-2 text-lg">Individual</h3>
                                    <p class="text-sm text-muted-foreground">One range per user</p>
                                    <div class="mt-3 min-h-[1.5rem] flex items-center justify-center">
                                        {#if formData.type === 'INDIVIDUAL'}
                                            <Badge>Selected</Badge>
                                        {/if}
                                    </div>
                                </div>
                            </button>

                            <button
                                class="w-full p-6 border-2 rounded-lg transition-all min-h-[8.5rem] {formData.type === 'SHARED' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                                onclick={() => handleTypeChange('SHARED')}
                            >
                                <div class="text-center h-full flex flex-col justify-center">
                                    <h3 class="font-semibold mb-2 text-lg">Shared</h3>
                                    <p class="text-sm text-muted-foreground">Users share main user's range</p>
                                    <div class="mt-3 min-h-[1.5rem] flex items-center justify-center">
                                        {#if formData.type === 'SHARED'}
                                            <Badge>Selected</Badge>
                                        {/if}
                                    </div>
                                </div>
                            </button>
                        </div>

                        <!-- Manage Users Button - always shown at bottom -->
                        <div class="mt-auto pt-6">
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
                <Card.Root class="h-full min-h-[32rem] flex flex-col {!formData.type ? 'opacity-50 pointer-events-none' : ''}">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 2: Select users</Card.Title>
                        <Card.Description class="text-base">
                            {#if formData.type === 'INDIVIDUAL'}
                                Enter pool users and teams
                            {:else if formData.type === 'SHARED'}
                                Enter main user and pool users and teams
                            {:else}
                                Select a pool type first
                            {/if}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-3 p-6 flex-1 flex flex-col">


                        <!-- Users and Teams Input (second for consistency) -->
                        {#if formData.type === 'INDIVIDUAL' || formData.type === 'SHARED'}
                            <div class="flex-1 flex flex-col min-h-0">
                                <div class="text-sm font-medium mb-1">
                                    Pool Users and Teams *
                                </div>
                                <p class="text-xs text-muted-foreground mb-2">
                                    {#if formData.type === 'SHARED'}
                                        Enter one per line "Username, MainUserId, Team" or "Username, MainUserId"
                                    {:else}
                                        Enter one per line "Username, Team" or "Username"
                                    {/if}
                                </p>
                                <textarea
                                    bind:value={formData.bulkUserInput}
                                    placeholder={formData.type === 'SHARED' ? 
                                        "Alice Dan, MainUser1, smurfs\nBob Dylan, MainUser2, gargamel\nDave Smith, MainUser1, smurfs" : 
                                        "Alice Dan, smurfs\nBob Dylan, gargamel\nDave Smith, smurfs"}
                                    class="w-full flex-1 p-4 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                                ></textarea>
                                <div class="min-h-[1.25rem] flex items-center mt-1">
                                    <p class="text-xs text-muted-foreground">
                                        {parseBulkUsers(formData.bulkUserInput).length} user(s) parsed
                                    </p>
                                </div>
                            </div>

                            <!-- Main User Search Helper (for SHARED pools only) -->
                            {#if formData.type === 'SHARED'}
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
                        {/if}

                        <!-- Check Users in Pools Button -->
                        <div class="pt-3">
                            {#if formData.type === 'INDIVIDUAL' || formData.type === 'SHARED'}
                                <Button 
                                    variant="outline" 
                                    onclick={checkUsersInOtherPools}
                                    disabled={!formData.bulkUserInput.trim()}
                                    class="w-full flex items-center gap-2"
                                >
                                    <Search class="h-4 w-4" />
                                    Search Users and Teams
                                </Button>
                            {/if}
                        </div>
                    </Card.Content>
                </Card.Root>

                <!-- Step 3: Select Topology & Note -->
                <Card.Root class="h-full min-h-[32rem] flex flex-col {!formData.type ? 'opacity-50 pointer-events-none' : ''}">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 3: Topology & Note</Card.Title>
                        <Card.Description class="text-base">
                            {#if formData.type}
                                Choose the topology and add notes for your pool
                            {:else}
                                Select a pool type first
                            {/if}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-6 p-6 flex-1 flex flex-col">
                        <div class="flex-1 space-y-6">
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
                                                            value={topology.label}
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
                                <div class="text-sm font-medium">Note * <span class="text-muted-foreground">(maximum 15 characters)</span></div>
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
                        </div>

                        <div class="mt-auto pt-6">
                            <div class="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                <strong>Created by:</strong> {createdBy}
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>
            </div>
        </div>
    </div>


</div>
