<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as Select from '$lib/components/ui/select';
    import * as Card from '$lib/components/ui/card';
    import * as Alert from '$lib/components/ui/alert';
    import { Badge } from '$lib/components/ui/badge';
    import { AlertCircle, CheckCircle2, X, RotateCcw } from 'lucide-svelte';
    import { browser } from '$app/environment';
    import type { PageData } from './$types';
    import { createRange, type RangeRequest } from '$lib/api/ranges.client';

    let { data }: { data: PageData } = $props();

    // Range type options
    type RangeType = 'INDIVIDUAL' | 'SHARED' | 'CTFD';

    // Form state
    interface RangeFormData {
        type: RangeType | null;
        topologyId: string;
        topologyName: string;
        username: string;
        team: string;
        mainUser: string;
        mainUserName: string;
        selectedUsers: string[];
        bulkUserInput: string; // For pasting multiple users
        ctfdUser: string;
        ctfdUserName: string;
    }

    let formData = $state<RangeFormData>({
        type: null,
        topologyId: '',
        topologyName: '',
        username: '',
        team: '',
        mainUser: '',
        mainUserName: '',
        selectedUsers: [],
        bulkUserInput: '',
        ctfdUser: '',
        ctfdUserName: ''
    });

    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);
    let showContinueDialog = $state(false);

    // LocalStorage key
    const STORAGE_KEY = 'artemis-range-form';

    // Load from localStorage on mount
    $effect(() => {
        if (browser) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsedData = JSON.parse(saved);
                    if (parsedData.type) {
                        showContinueDialog = true;
                    }
                } catch (e) {
                    console.error('Error parsing saved form data:', e);
                }
            }
        }
    });

    // Save to localStorage whenever formData changes
    $effect(() => {
        if (browser && formData.type) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    });

    // Filter users based on range type
    function getFilteredUsers() {
        // HEUHEUHEUEHEHEUEHUEHEUHEUHEU
        //if (formData.type === 'CTFD') {
        //    return data.users.filter(user => user.userID.startsWith('CTFD'));
        //} else if (formData.type === 'SHARED' || formData.type === 'INDIVIDUAL') {
        //    return data.users.filter(user => user.userID.startsWith('BATCH'));
        // }
        return data.users;
    }

    function handleTypeChange(type: RangeType) {
        formData.type = type;
        // Reset dependent fields when type changes
        formData.mainUser = '';
        formData.mainUserName = '';
        formData.selectedUsers = [];
        formData.bulkUserInput = '';
        formData.ctfdUser = '';
        formData.ctfdUserName = '';
    }

    function handleTopologyChange(value: string) {
        formData.topologyId = value;
        const topology = data.topologies.find(t => t.ID === value);
        formData.topologyName = topology?.Name || '';
    }

    function continuePrevious() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsedData = JSON.parse(saved);
                formData = { ...formData, ...parsedData };
                showContinueDialog = false;
            } catch (e) {
                console.error('Error loading saved data:', e);
                startFresh();
            }
        }
    }

    function startFresh() {
        formData = {
            type: null,
            topologyId: '',
            topologyName: '',
            username: '',
            team: '',
            mainUser: '',
            mainUserName: '',
            selectedUsers: [],
            bulkUserInput: '',
            ctfdUser: '',
            ctfdUserName: ''
        };
        if (browser) {
            localStorage.removeItem(STORAGE_KEY);
        }
        showContinueDialog = false;
    }

    function resetForm() {
        startFresh();
    }

    function showAlert(type: 'success' | 'error', message: string) {
        alertMessage = { type, message };
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    // Parse bulk user input for INDIVIDUAL ranges
    function parseBulkUsers(input: string): Array<{ username: string; team: string }> {
        if (!input.trim()) return [];
        
        const lines = input.trim().split('\n');
        const users: Array<{ username: string; team: string }> = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const parts = trimmed.split(',').map(part => part.trim());
            if (parts.length >= 2) {
                users.push({
                    username: parts[0],
                    team: parts[1]
                });
            }
        }
        
        return users;
    }

    function handleMainUserChange(value: string) {
        formData.mainUser = value || '';
        const user = data.users.find(u => u.userID === value);
        formData.mainUserName = user?.name || '';
    }

    function handleCtfdUserChange(value: string) {
        formData.ctfdUser = value || '';
        const user = data.users.find(u => u.userID === value);
        formData.ctfdUserName = user?.name || '';
    }

    function handleSubmit() {
        // Validate required fields
        if (!formData.type || !formData.topologyId) {
            showAlert('error', 'Please select a range type and topology');
            return;
        }

        if (formData.type === 'INDIVIDUAL' && !formData.bulkUserInput.trim()) {
            showAlert('error', 'Please enter users for individual range');
            return;
        }

        if (formData.type === 'SHARED' && !formData.mainUser) {
            showAlert('error', 'Please select a main user for shared range');
            return;
        }

        if (formData.type === 'CTFD' && !formData.ctfdUser) {
            showAlert('error', 'Please select a CTFD user');
            return;
        }

        // Create range via API
        submitRange();
    }

    async function submitRange() {
        try {
            if (formData.type === 'INDIVIDUAL') {
                // Parse bulk users and create multiple individual ranges
                const users = parseBulkUsers(formData.bulkUserInput);
                if (users.length === 0) {
                    showAlert('error', 'No valid users found in input');
                    return;
                }

                let successCount = 0;
                let failCount = 0;

                for (const user of users) {
                    try {
                        const rangeData: RangeRequest = {
                            name: user.username.trim(),
                            description: `Individual range for ${user.username} (Team: ${user.team})`,
                            type: 'INDIVIDUAL',
                            topology_id: formData.topologyId
                        };

                        await createRange(rangeData);
                        successCount++;
                    } catch (error) {
                        console.error(`Error creating range for ${user.username}:`, error);
                        failCount++;
                    }
                }

                if (successCount > 0) {
                    showAlert('success', `Successfully created ${successCount} individual ranges${failCount > 0 ? ` (${failCount} failed)` : ''}`);
                } else {
                    showAlert('error', 'Failed to create any ranges');
                }
            } else {
                // Create single range for SHARED or CTFD
                let rangeData: RangeRequest;
                
                if (formData.type === 'SHARED') {
                    rangeData = {
                        name: `shared-${formData.mainUserName}-${Date.now()}`,
                        description: `Shared range with main user ${formData.mainUserName}`,
                        type: 'SHARED',
                        topology_id: formData.topologyId,
                        users: [formData.mainUser]
                    };
                } else { // CTFD
                    rangeData = {
                        name: `ctfd-${formData.ctfdUserName}-${Date.now()}`,
                        description: `CTFD range for ${formData.ctfdUserName}`,
                        type: 'CTFD',
                        topology_id: formData.topologyId,
                        users: [formData.ctfdUser]
                    };
                }

                await createRange(rangeData);
                showAlert('success', `${formData.type} range created successfully!`);
            }
            
            // Clear form after successful submission
            if (browser) {
                localStorage.removeItem(STORAGE_KEY);
            }
            resetForm();
        } catch (error) {
            console.error('Error creating range:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create range';
            showAlert('error', `Error creating range: ${errorMessage}`);
        }
    }

    function isFormValid(): boolean {
        if (!formData.type || !formData.topologyId) {
            return false;
        }
        
        if (formData.type === 'INDIVIDUAL') {
            return formData.bulkUserInput.trim().length > 0;
        }
        
        if (formData.type === 'SHARED') {
            return formData.mainUser.length > 0;
        }
        
        if (formData.type === 'CTFD') {
            return formData.ctfdUser.length > 0;
        }
        
        return false;
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Create Range</h1>
            <p class="text-sm text-muted-foreground">
                Configure and deploy a new training range
            </p>
        </div>
        <Button variant="outline" onclick={resetForm} class="flex items-center gap-2">
            <RotateCcw class="h-4 w-4" />
            Reset Form
        </Button>
    </div>

    <!-- Continue Previous Session Dialog -->
    {#if showContinueDialog}
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card.Root class="w-96">
                <Card.Header>
                    <Card.Title>Continue Previous Session?</Card.Title>
                    <Card.Description>
                        We found a previous range configuration. Would you like to continue where you left off or start fresh?
                    </Card.Description>
                </Card.Header>
                <Card.Footer class="flex gap-2">
                    <Button variant="outline" onclick={startFresh} class="flex-1">
                        Start Fresh
                    </Button>
                    <Button onclick={continuePrevious} class="flex-1">
                        Continue
                    </Button>
                </Card.Footer>
            </Card.Root>
        </div>
    {/if}

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

    <div class="flex-1 min-h-0 w-full overflow-auto">
        <div class="max-w-4xl mx-auto space-y-6">
            <!-- Step 1: Range Type Selection -->
            <Card.Root>
                <Card.Header>
                    <Card.Title>Step 1: Select Range Type</Card.Title>
                    <Card.Description>Choose the type of range you want to create</Card.Description>
                </Card.Header>
                <Card.Content>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            class="p-4 border-2 rounded-lg transition-all {formData.type === 'INDIVIDUAL' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                            onclick={() => handleTypeChange('INDIVIDUAL')}
                        >
                            <div class="text-center">
                                <h3 class="font-semibold mb-2">Individual</h3>
                                <p class="text-sm text-muted-foreground">One range per user</p>
                                {#if formData.type === 'INDIVIDUAL'}
                                    <Badge class="mt-2">Selected</Badge>
                                {/if}
                            </div>
                        </button>

                        <button
                            class="p-4 border-2 rounded-lg transition-all {formData.type === 'SHARED' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                            onclick={() => handleTypeChange('SHARED')}
                        >
                            <div class="text-center">
                                <h3 class="font-semibold mb-2">Shared</h3>
                                <p class="text-sm text-muted-foreground">Multi-user shared range</p>
                                {#if formData.type === 'SHARED'}
                                    <Badge class="mt-2">Selected</Badge>
                                {/if}
                            </div>
                        </button>

                        <button
                            class="p-4 border-2 rounded-lg transition-all {formData.type === 'CTFD' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                            onclick={() => handleTypeChange('CTFD')}
                        >
                            <div class="text-center">
                                <h3 class="font-semibold mb-2">CTFD</h3>
                                <p class="text-sm text-muted-foreground">Deploy CTFD Instance</p>
                                {#if formData.type === 'CTFD'}
                                    <Badge class="mt-2">Selected</Badge>
                                {/if}
                            </div>
                        </button>
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- Step 2: Configuration (only show if type is selected) -->
            {#if formData.type}
                <Card.Root>
                    <Card.Header>
                        <Card.Title>Step 2: Configure Range</Card.Title>
                        <Card.Description>
                            Set up your {formData.type.toLowerCase()} range configuration
                        </Card.Description>
                    </Card.Header>
                    <Card.Content>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Left Column: Basic Configuration -->
                            <div class="space-y-6">
                                <!-- Topology Selection -->
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Topology *</label>
                                    <Select.Root 
                                        onSelectedChange={handleTopologyChange} 
                                        selected={formData.topologyId ? { 
                                            value: formData.topologyId, 
                                            label: formData.topologyName || formData.topologyId 
                                        } : undefined}
                                    >
                                        <Select.Trigger class="w-full">
                                            <Select.Value placeholder="Select topology..." />
                                        </Select.Trigger>
                                        <Select.Content>
                                            {#each data.topologies as topology}
                                                <Select.Item value={topology.ID}>
                                                    <div class="flex flex-col items-start">
                                                        <span class="font-medium">{topology.Name}</span>
                                                        <span class="text-xs text-muted-foreground">ID: {topology.ID}</span>
                                                    </div>
                                                </Select.Item>
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                </div>

                                <!-- Shared Range: Main User Selection -->
                                {#if formData.type === 'SHARED'}
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium">Main User *</label>
                                        <Select.Root 
                                            onSelectedChange={handleMainUserChange} 
                                            selected={formData.mainUser ? { 
                                                value: formData.mainUser, 
                                                label: formData.mainUserName || formData.mainUser 
                                            } : undefined}
                                        >
                                            <Select.Trigger class="w-full">
                                                <Select.Value placeholder="Select main user..." />
                                            </Select.Trigger>
                                            <Select.Content>
                                                {#each getFilteredUsers() as user}
                                                    <Select.Item value={user.userID}>
                                                        <div class="flex flex-col items-start">
                                                            <span class="font-medium">{user.name}</span>
                                                            <span class="text-xs text-muted-foreground">ID: {user.userID}</span>
                                                        </div>
                                                    </Select.Item>
                                                {/each}
                                            </Select.Content>
                                        </Select.Root>
                                    </div>
                                {/if}

                                <!-- CTFD Range: User Selection -->
                                {#if formData.type === 'CTFD'}
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium">CTFD User *</label>
                                        <Select.Root 
                                            onSelectedChange={handleCtfdUserChange} 
                                            selected={formData.ctfdUser ? { 
                                                value: formData.ctfdUser, 
                                                label: formData.ctfdUserName || formData.ctfdUser 
                                            } : undefined}
                                        >
                                            <Select.Trigger class="w-full">
                                                <Select.Value placeholder="Select CTFD user..." />
                                            </Select.Trigger>
                                            <Select.Content>
                                                {#each getFilteredUsers() as user}
                                                    <Select.Item value={user.userID}>
                                                        <div class="flex flex-col items-start">
                                                            <span class="font-medium">{user.name}</span>
                                                            <span class="text-xs text-muted-foreground">ID: {user.userID}</span>
                                                        </div>
                                                    </Select.Item>
                                                {/each}
                                            </Select.Content>
                                        </Select.Root>
                                    </div>
                                {/if}
                            </div>

                            <!-- Right Column: User Input -->
                            <div class="space-y-6">
                                <!-- Individual Range: Bulk User Input -->
                                {#if formData.type === 'INDIVIDUAL'}
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium">Users and Teams *</label>
                                        <p class="text-xs text-muted-foreground mb-2">
                                            Paste users in the format: "Username, Team" (one per line)
                                        </p>
                                        <textarea
                                            bind:value={formData.bulkUserInput}
                                            placeholder="Alice Dan, smurfs
Bob Dylan, gargamel
Charlie Brown, peanuts"
                                            class="w-full h-64 px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                                        ></textarea>
                                        {#if formData.bulkUserInput.trim()}
                                            <p class="text-xs text-muted-foreground">
                                                {parseBulkUsers(formData.bulkUserInput).length} user(s) parsed
                                            </p>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Shared Range: Additional Users -->
                                {#if formData.type === 'SHARED'}
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium">Additional Users and Teams</label>
                                        <p class="text-xs text-muted-foreground mb-2">
                                            Optional: Paste additional users in the format: "Username, Team" (one per line)
                                        </p>
                                        <textarea
                                            bind:value={formData.bulkUserInput}
                                            placeholder="Alice Dan, smurfs
Bob Dylan, gargamel
Charlie Brown, peanuts"
                                            class="w-full h-48 px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none rounded-md"
                                        ></textarea>
                                        {#if formData.bulkUserInput.trim()}
                                            <p class="text-xs text-muted-foreground">
                                                {parseBulkUsers(formData.bulkUserInput).length} additional user(s) parsed
                                            </p>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Debug: Show loaded data -->
                                <div class="text-xs text-muted-foreground">
                                    <p>Topologies loaded: {data.topologies.length}</p>
                                    <p>Users loaded: {data.users.length}</p>
                                    <p>Filtered users: {getFilteredUsers().length}</p>
                                </div>
                            </div>
                        </div>
                    </Card.Content>
                    <Card.Footer>
                        <Button
                            onclick={handleSubmit}
                            disabled={!isFormValid()}
                            class="w-full"
                        >
                            Create {formData.type} Range
                        </Button>
                    </Card.Footer>
                </Card.Root>
            {/if}
        </div>
    </div>
</div>
