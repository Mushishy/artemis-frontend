<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import * as Card from '$lib/components/ui/card';
    import * as Alert from '$lib/components/ui/alert';
    import { RotateCcw, AlertCircle, CheckCircle2, X, Send, ChevronsUpDown, Check } from 'lucide-svelte';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { createCtfdTopology } from '$lib/api/client/topology.client';
    import { getScenariosDisplay } from '$lib/api/client/ctfd.client';
    import { loadPools as loadPoolsAPI } from '$lib/api/client/pools.client';
    import { allTimezones } from '$lib/utils/timezones';

    // Form state with default values
    let config = $state({
        topologyName: "",
        scenarioId: "",
        poolId: "",
        
        usernameConfig: "admin",
        passwordConfig: "admin",
        adminUsername: "supervisor",
        adminPassword: "admin",
        
        ctfName: "",
        ctfDescription: "",
        challengeVisibility: "private" as const,
        accountVisibility: "private" as const,
        scoreVisibility: "private" as const,
        registrationVisibility: "private" as const,
        allowNameChanges: "no" as const,
        allowTeamCreation: "no" as const,
        allowTeamDisbanding: "no" as const,
        
        confStartTime: "",
        confStopTime: "",
        timeZone: "Europe/Vienna",
        allowViewingAfter: "yes" as const
    });

    // Alert state
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);
    let isSubmitting = $state(false);

    // Dropdown state
    let scenarioOpen = $state(false);
    let poolOpen = $state(false);
    let timezoneOpen = $state(false);
    let allowViewingAfterOpen = $state(false);
    let challengeVisibilityOpen = $state(false);
    let accountVisibilityOpen = $state(false);
    let scoreVisibilityOpen = $state(false);
    let registrationVisibilityOpen = $state(false);
    let allowNameChangesOpen = $state(false);
    let allowTeamCreationOpen = $state(false);
    let allowTeamDisbandingOpen = $state(false);
    let scenarioOptions = $state<{ value: string; label: string; description?: string }[]>([]);
    let poolOptions = $state<{ value: string; label: string; description?: string; poolId?: string }[]>([]);

    // Load scenarios and pools on component mount
    async function loadScenarios() {
        try {
            const scenarios = await getScenariosDisplay();
            scenarioOptions = scenarios.map(scenario => ({
                value: scenario.ID,
                label: scenario.Name,
                description: scenario.ID
            }));
        } catch (error) {
            scenarioOptions = [];
            showAlert('Failed to load scenarios. Please refresh the page.', 'error');
        }
    }

    async function loadPools() {
        try {
            const pools = await loadPoolsAPI();
            poolOptions = pools.map(pool => ({
                value: pool.poolId,
                label: pool.note || 'No description',
                description: pool.note || 'No description',
                poolId: pool.poolId
            }));
        } catch (error) {
            poolOptions = [];
            showAlert('Failed to load pools. Please refresh the page.', 'error');
        }
    }
    
    // Remove duplicates from timezone options
    const timezoneOptions = allTimezones.filter((timezone, index, arr) => 
        arr.findIndex(t => t.value === timezone.value) === index
    );

    // Visibility options
    const visibilityOptions = [
        { value: "private", label: "private" },
        { value: "public", label: "public" }
    ];

    // Yes/No options
    const yesNoOptions = [
        { value: "no", label: "no" },
        { value: "yes", label: "yes" }
    ];

    // Action Function
    function showAlert(message: string, type: 'success' | 'error') {
        alertMessage = { message, type };
        setTimeout(() => {
            alertMessage = null;
        }, 10000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function resetForm() {
        config = {
            topologyName: "",
            scenarioId: "",
            poolId: "",
            
            usernameConfig: "admin",
            passwordConfig: "admin",
            adminUsername: "supervisor",
            adminPassword: "admin",
            
            ctfName: "",
            ctfDescription: "",
            challengeVisibility: "private" as const,
            accountVisibility: "private" as const,
            scoreVisibility: "private" as const,
            registrationVisibility: "private" as const,
            allowNameChanges: "no" as const,
            allowTeamCreation: "no" as const,
            allowTeamDisbanding: "no" as const,
            
            confStartTime: "",
            confStopTime: "",
            timeZone: "Europe/Vienna",
            allowViewingAfter: "yes" as const
        };
    }

    async function handleSubmit() {
        if (!config.topologyName.trim() || !config.scenarioId.trim() || !config.poolId.trim()) {
            showAlert('Please fill in all required fields (Topology Name, Scenario ID, Pool ID)', 'error');
            return;
        }

        try {
            isSubmitting = true;
            showAlert('Creating CTFd topology...', 'success');
            
            const result = await createCtfdTopology(config);
            showAlert(`CTFd topology "${result.topologyName}" created successfully with ID: ${result.topologyId}`, 'success');
            
            // Reset form on success
            resetForm();
        } catch (error: any) {
            let errorMessage = 'CTFd topology creation was not successful. Please check your inputs and try again.';
            
            // Extract detailed error message if available
            if (error.response?.data) {
                const responseData = error.response.data;
                if (responseData.error) {
                    errorMessage = responseData.error;
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (typeof responseData === 'string') {
                    errorMessage = responseData;
                }
            } else if (error.code === 'NETWORK_ERROR' || error.name === 'NetworkError') {
                errorMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage = `Creation failed: ${error.message}`;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            isSubmitting = false;
        }
    }

    // Load data on mount
    loadScenarios();
    loadPools();
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div>
            <h1 class="text-3xl font-bold">Create CTFd</h1>
            <p class="text-sm text-muted-foreground">
                Create a topology with automated CTFd deployment tailored to your new shared CTFd pool
            </p>
        </div>
        <div class="flex gap-2">
            <Button variant="outline" onclick={resetForm} class="flex items-center gap-2" disabled={isSubmitting}>
                <RotateCcw class="h-4 w-4" />
                Reset Form
            </Button>
            <Button onclick={handleSubmit} class="flex items-center gap-2" disabled={isSubmitting}>
                <Send class="h-4 w-4" />
                {isSubmitting ? 'Creating...' : 'Create CTFd Topology'}
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

    <!-- Single compact grid layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Column 1: Scenario & Time Settings -->
        <div class="space-y-4">
            <!-- Scenario Configuration -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">Scenario Configuration</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="topologyName" class="text-sm">Topology Name *</Label>
                        <Input 
                            id="topologyName" 
                            bind:value={config.topologyName}
                            placeholder="Topology name *"
                        />
                    </div>
                    <div>
                        <Label for="scenarioId" class="text-sm">Scenario ID *</Label>
                        <Popover.Root bind:open={scenarioOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={scenarioOpen}
                                        class="w-full justify-between"
                                    >
                                        {scenarioOptions.find((s) => s.value === config.scenarioId)?.label ?? "Select scenario..."}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-[400px] p-0">
                                <Command.Root>
                                    <Command.Input placeholder="Search scenarios..." />
                                    <Command.Empty>No scenario found.</Command.Empty>
                                    <Command.Group>
                                        {#each scenarioOptions as scenario}
                                            <Command.Item
                                                value={scenario.label}
                                                onSelect={() => {
                                                    config.scenarioId = scenario.value;
                                                    scenarioOpen = false;
                                                }}
                                            >
                                                <Check class="mr-2 h-4 w-4 {config.scenarioId === scenario.value ? 'opacity-100' : 'opacity-0'}" />
                                                <div class="flex flex-col">
                                                    <span>{scenario.label}</span>
                                                    {#if scenario.description}
                                                        <span class="text-xs text-muted-foreground">ID: {scenario.description}</span>
                                                    {/if}
                                                </div>
                                            </Command.Item>
                                        {/each}
                                    </Command.Group>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="poolId" class="text-sm">Pool ID *</Label>
                        <Popover.Root bind:open={poolOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={poolOpen}
                                        class="w-full justify-between"
                                    >
                                        {poolOptions.find((p) => p.value === config.poolId)?.label ?? "Select pool..."}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-[400px] p-0">
                                <Command.Root>
                                    <Command.Input placeholder="Search pools..." />
                                    <Command.Empty>No pool found.</Command.Empty>
                                    <Command.Group>
                                        {#each poolOptions as pool}
                                            <Command.Item
                                                value={pool.label}
                                                onSelect={() => {
                                                    config.poolId = pool.value;
                                                    poolOpen = false;
                                                }}
                                            >
                                                <Check class="mr-2 h-4 w-4 {config.poolId === pool.value ? 'opacity-100' : 'opacity-0'}" />
                                                <div class="flex flex-col">
                                                    <span>{pool.label}</span>
                                                    {#if pool.poolId}
                                                        <span class="text-xs text-muted-foreground">ID: {pool.poolId}</span>
                                                    {/if}
                                                </div>
                                            </Command.Item>
                                        {/each}
                                    </Command.Group>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- Time Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">Time Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="confStartTime" class="text-sm">Start Time</Label>
                        <Input 
                            id="confStartTime" 
                            bind:value={config.confStartTime}
                            placeholder="DD/MM/YYYY HH:MM (optional)"
                            class="h-10"
                        />
                        <p class="text-xs text-muted-foreground mt-1">Format: DD/MM/YYYY HH:MM (e.g., 20/07/2025 15:30)</p>
                    </div>
                    <div>
                        <Label for="confStopTime" class="text-sm">Stop Time</Label>
                        <Input 
                            id="confStopTime" 
                            bind:value={config.confStopTime}
                            placeholder="DD/MM/YYYY HH:MM (optional)"
                            class="h-10"
                        />
                        <p class="text-xs text-muted-foreground mt-1">Format: DD/MM/YYYY HH:MM (e.g., 21/07/2025 15:30)</p>
                    </div>
                    <div>
                        <Label for="timeZone" class="text-sm">Timezone</Label>
                        <Popover.Root bind:open={timezoneOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={timezoneOpen}
                                    >
                                        {timezoneOptions.find(t => t.value === config.timeZone)?.label || "Select timezone"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.Input placeholder="Search timezones..." />
                                    <Command.List>
                                        <Command.Empty>No timezone found.</Command.Empty>
                                        <Command.Group>
                                            {#each timezoneOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.timeZone = option.value;
                                                        timezoneOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.timeZone !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="allowViewingAfter" class="text-sm">Allow Viewing After End</Label>
                        <Popover.Root bind:open={allowViewingAfterOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowViewingAfterOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowViewingAfter)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowViewingAfter = option.value as typeof config.allowViewingAfter;
                                                        allowViewingAfterOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowViewingAfter !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Column 2: CTFd Settings -->
        <div class="space-y-4">
            <!-- CTFd Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">CTFd Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="adminUsername" class="text-sm">Admin Username</Label>
                        <Input 
                            id="adminUsername" 
                            bind:value={config.adminUsername}
                            placeholder="New admin username"
                        />
                    </div>
                    <div>
                        <Label for="adminPassword" class="text-sm">Admin Password</Label>
                        <Input 
                            id="adminPassword" 
                            type="text"
                            bind:value={config.adminPassword}
                            placeholder="New admin password"
                        />
                    </div>
                    <div>
                        <Label for="ctfName" class="text-sm">CTF Name</Label>
                        <Input 
                            id="ctfName" 
                            bind:value={config.ctfName}
                            placeholder="CTF name (optional)"
                        />
                    </div>
                    <div>
                        <Label for="ctfDescription" class="text-sm">CTF Description</Label>
                        <Input 
                            id="ctfDescription" 
                            bind:value={config.ctfDescription}
                            placeholder="CTF description (optional)"
                        />
                    </div>
                    <div>
                        <Label for="usernameConfig" class="text-sm">Username (used during configuration)</Label>
                        <Input 
                            id="usernameConfig" 
                            bind:value={config.usernameConfig}
                            placeholder="Scenario username"
                        />
                    </div>
                    <div>
                        <Label for="passwordConfig" class="text-sm">Password (used during configuration)</Label>
                        <Input 
                            id="passwordConfig" 
                            type="text"
                            bind:value={config.passwordConfig}
                            placeholder="Scenario password"
                        />
                    </div>
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Column 3: Visibility & User/Team Settings -->
        <div class="space-y-4">
            <!-- Visibility Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">Visibility Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="challengeVisibility" class="text-sm">Challenge Visibility</Label>
                        <Popover.Root bind:open={challengeVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={challengeVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.challengeVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.challengeVisibility = option.value as typeof config.challengeVisibility;
                                                        challengeVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.challengeVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="accountVisibility" class="text-sm">Account Visibility</Label>
                        <Popover.Root bind:open={accountVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={accountVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.accountVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.accountVisibility = option.value as typeof config.accountVisibility;
                                                        accountVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.accountVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="scoreVisibility" class="text-sm">Score Visibility</Label>
                        <Popover.Root bind:open={scoreVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={scoreVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.scoreVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.scoreVisibility = option.value as typeof config.scoreVisibility;
                                                        scoreVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.scoreVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="registrationVisibility" class="text-sm">Registration Visibility</Label>
                        <Popover.Root bind:open={registrationVisibilityOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={registrationVisibilityOpen}
                                    >
                                        {visibilityOptions.find(o => o.value === config.registrationVisibility)?.label || "Select visibility"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each visibilityOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.registrationVisibility = option.value as typeof config.registrationVisibility;
                                                        registrationVisibilityOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.registrationVisibility !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>

            <!-- User/Team Settings -->
            <Card.Root>
                <Card.Header class="pb-3">
                    <Card.Title class="text-lg">User & Team Settings</Card.Title>
                </Card.Header>
                <Card.Content class="space-y-3">
                    <div>
                        <Label for="allowNameChanges" class="text-sm">Allow Name Changes</Label>
                        <Popover.Root bind:open={allowNameChangesOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowNameChangesOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowNameChanges)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowNameChanges = option.value as typeof config.allowNameChanges;
                                                        allowNameChangesOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowNameChanges !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="allowTeamCreation" class="text-sm">Allow Team Creation</Label>
                        <Popover.Root bind:open={allowTeamCreationOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowTeamCreationOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowTeamCreation)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowTeamCreation = option.value as typeof config.allowTeamCreation;
                                                        allowTeamCreationOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowTeamCreation !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                    <div>
                        <Label for="allowTeamDisbanding" class="text-sm">Allow Team Disbanding</Label>
                        <Popover.Root bind:open={allowTeamDisbandingOpen}>
                            <Popover.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="outline"
                                        class="w-full justify-between"
                                        role="combobox"
                                        aria-expanded={allowTeamDisbandingOpen}
                                    >
                                        {yesNoOptions.find(o => o.value === config.allowTeamDisbanding)?.label || "Select option"}
                                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                {/snippet}
                            </Popover.Trigger>
                            <Popover.Content class="w-full p-0">
                                <Command.Root>
                                    <Command.List>
                                        <Command.Group>
                                            {#each yesNoOptions as option (option.value)}
                                                <Command.Item
                                                    value={option.label}
                                                    onSelect={() => {
                                                        config.allowTeamDisbanding = option.value as typeof config.allowTeamDisbanding;
                                                        allowTeamDisbandingOpen = false;
                                                    }}
                                                >
                                                    <Check
                                                        class="mr-2 h-4 w-4 {config.allowTeamDisbanding !== option.value && 'text-transparent'}"
                                                    />
                                                    {option.label}
                                                </Command.Item>
                                            {/each}
                                        </Command.Group>
                                    </Command.List>
                                </Command.Root>
                            </Popover.Content>
                        </Popover.Root>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>
    </div>
</div>