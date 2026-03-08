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
    import { createPool, createDevPool, checkUsersInPools } from '$lib/api/client/pools.client';
    import { getMainUsers } from '$lib/api/client/users.client';
    import type { PoolRequest, PoolUserAndTeam } from '$lib/api/types';
    import { userStore } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { normalizeText } from '$lib/utils/helper';

    let { data }: { data: PageData } = $props();

    // Pool type options
    type PoolType = 'INDIVIDUAL' | 'SHARED' | 'CTFD';

    // Form state
    type PoolFormData = {
        type: PoolType | null
        topologyId: string
        topologyName: string
        bulkUserInput: string
        note: string
        isDev: boolean
    }
    
    let formData: PoolFormData = $state({
        type: null,
        topologyId: "",
        topologyName: "",
        bulkUserInput: "",
        note: "",
        isDev: false
    });

    let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);

    // Combobox state
    let topologyOpen = $state(false);
    let topologyTriggerRef = $state<HTMLButtonElement>(null!);
    let mainUsersOpen = $state(false);
    let mainUsersTriggerRef = $state<HTMLButtonElement>(null!);
    let mainUsersData = $state<string[]>([]);
    let mainUsersLoading = $state(false);

    // Team management state (INDIVIDUAL)
    let teamsDialogOpen = $state(false);
    let assignUsersDialogOpen = $state(false);
    let teams = $state<string[]>([]);
    let teamUsers = $state<Record<string, string>>({});
    let newTeamName = $state('');

    // Shared pool management state
    let selectedMainUsers = $state<string[]>([]);
    let mainUserUsers = $state<Record<string, string>>({});
    let manageMainUsersDialogOpen = $state(false);
    let assignToMainUsersDialogOpen = $state(false);
    let sharedTeamsDialogOpen = $state(false);
    let assignToTeamsDialogOpen = $state(false);
    let sharedTeams = $state<string[]>([]);
    let sharedNewTeamName = $state('');
    let selectedTeamForAssignment = $state('');
    let userTeamAssignments = $state<Record<string, string>>({});

    // CTFd pool management state
    let selectedCtfdUser = $state<string | null>(null);
    let selectCtfdUserDialogOpen = $state(false);
    let ctfdAssignUsersDialogOpen = $state(false);
    let ctfdUserInput = $state('');



    // Transform data for combobox format
    const topologyOptions = $derived(
        data.topologies
            .filter(topology => {
                // For CTFd pools, only show topologies starting with 'ctfd_'
                if (formData.type === 'CTFD') {
                    return topology.Name.toLowerCase().startsWith('ctfd_');
                }
                return true;
            })
            .map(topology => ({
                value: topology.ID,
                label: topology.Name,
                description: `ID: ${topology.ID}`
            }))
    );

    const mainUsersOptions = $derived(
        Array.isArray(mainUsersData) ? mainUsersData.map(userId => ({
            value: userId,
            label: userId,
            description: `Main User: ${userId}`
        })) : []
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

    // Track the last pool type to prevent infinite loops
    let lastPoolType = $state<PoolType | null>(null);

    // Load main users data when pool type changes
    $effect(() => {
        // Only react to formData.type changes
        const currentType = formData.type;
        
        // Skip if type hasn't actually changed
        if (currentType === lastPoolType) {
            return;
        }
        
        lastPoolType = currentType;
        
        async function loadMainUsersData() {
            // Only load if we need main users (SHARED or CTFD pools)
            if (currentType !== 'SHARED' && currentType !== 'CTFD') {
                mainUsersData = [];
                mainUsersLoading = false;
                return;
            }

            try {
                mainUsersLoading = true;
                const isCtfd = currentType === 'CTFD';
                const result = await getMainUsers(isCtfd ? { isCtfd: 'true' } : {});
                
                // Ensure result.userIds is an array
                if (result && Array.isArray(result.userIds)) {
                    mainUsersData = result.userIds;
                } else {
                    console.warn('Invalid main users response:', result);
                    mainUsersData = [];
                }
            } catch (error) {
                console.error('Failed to load main users:', error);
                mainUsersData = [];
            } finally {
                mainUsersLoading = false;
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
        formData.isDev = false;
        // Reset shared pool state
        selectedMainUsers = [];
        mainUserUsers = {};
        sharedTeams = [];
        sharedNewTeamName = '';
        selectedTeamForAssignment = '';
        userTeamAssignments = {};
        // Reset CTFd pool state
        selectedCtfdUser = null;
        ctfdUserInput = '';
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

    function addSelectedUserToInput(selectedUserId: string) {
        if (!formData.bulkUserInput.trim()) {
            closeAndFocusMainUsersTrigger();
            return;
        }

        // Split existing content into lines
        const lines = formData.bulkUserInput.split('\n');
        
        // Process each line
        const updatedLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return line; // Keep empty lines as is
            
            if (formData.type === 'CTFD') {
                // For CTFd pools, append the selected CTFd user ID to each line
                // Check if the line already has a comma (already formatted)
                if (trimmedLine.includes(',')) {
                    return line; // Don't modify already formatted lines
                } else {
                    return `${trimmedLine}, ${selectedUserId}`;
                }
            } else if (formData.type === 'SHARED') {
                // For SHARED pools, append the main user ID
                if (trimmedLine.includes(',')) {
                    return line; // Don't modify already formatted lines
                } else {
                    return `${trimmedLine}, ${selectedUserId}`;
                }
            }
            return line;
        });
        
        formData.bulkUserInput = updatedLines.join('\n');
        closeAndFocusMainUsersTrigger();
    }



    function resetForm() {
        formData = {
            type: null,
            topologyId: '',
            topologyName: '',
            bulkUserInput: '',
            note: '',
            isDev: false
        };
        // Reset shared pool state
        selectedMainUsers = [];
        mainUserUsers = {};
        sharedTeams = [];
        sharedNewTeamName = '';
        selectedTeamForAssignment = '';
        userTeamAssignments = {};
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

        // For SHARED/CTFD pools, validate that all users have mainUserId
        if (formData.type === 'SHARED' || formData.type === 'CTFD') {
            const usersWithoutMainUserId = users.filter(u => !u.mainUserId.trim());
            if (usersWithoutMainUserId.length > 0) {
                const poolTypeName = formData.type === 'CTFD' ? 'CTFd' : 'SHARED';
                showAlert('error', `MainUserId is mandatory for all users in ${poolTypeName} pools. Please check your input format.`);
                return;
            }
            
            // Validate that all mainUserIds are valid (exist in mainUsersData)
            const invalidMainUsers = users.filter(u => !mainUsersData.includes(u.mainUserId.trim()));
            if (invalidMainUsers.length > 0) {
                const invalidIds = [...new Set(invalidMainUsers.map(u => u.mainUserId))].join(', ');
                const userType = formData.type === 'CTFD' ? 'CTFd users' : 'main users';
                showAlert('error', `Invalid MainUserId(s): ${invalidIds}. MainUserId must be one of the available ${userType}.`);
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
            if (!mainUsersLoading) {
                try {
                    mainUsersLoading = true;
                    const isCtfd = formData.type === 'CTFD';
                    const result = await getMainUsers(isCtfd ? { isCtfd: 'true' } : {});
                    if (result && Array.isArray(result.userIds)) {
                        mainUsersData = result.userIds;
                    }
                } catch (error) {
                    console.error('Failed to refresh main users:', error);
                } finally {
                    mainUsersLoading = false;
                }
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
            
            if (formData.type === 'SHARED' || formData.type === 'CTFD') {
                // For SHARED/CTFD: "Username, MainUserId, Team" or "Username, MainUserId"
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
        if (formData.type === 'INDIVIDUAL' || formData.type === 'SHARED' || formData.type === 'CTFD') {
            const users = parseBulkUsers(formData.bulkUserInput).map(u => ({ ...u, user: normalizeText(u.user) }));
            
            // For SHARED/CTFD pools, validate that all users have mainUserId
            if (formData.type === 'SHARED' || formData.type === 'CTFD') {
                const usersWithoutMainUserId = users.filter(u => !u.mainUserId.trim());
                if (usersWithoutMainUserId.length > 0) {
                    const poolTypeName = formData.type === 'CTFD' ? 'CTFd' : 'SHARED';
                    showAlert('error', `MainUserId is mandatory for all users in ${poolTypeName} pools. Please check your input format.`);
                    return;
                }
                
                // Validate that all mainUserIds are valid (exist in mainUsersData)
                const invalidMainUsers = users.filter(u => !mainUsersData.includes(u.mainUserId.trim()));
                if (invalidMainUsers.length > 0) {
                    const invalidIds = [...new Set(invalidMainUsers.map(u => u.mainUserId))].join(', ');
                    const userType = formData.type === 'CTFD' ? 'CTFd users' : 'main users';
                    showAlert('error', `Invalid MainUserId(s): ${invalidIds}. MainUserId must be one of the available ${userType}.`);
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
            // If CTFD dev mode is enabled, use the dev pool endpoint
            if (formData.type === 'CTFD' && formData.isDev) {
                await createDevPool(formData.note.trim());
                goto('/pools');
                return;
            }
            
            let poolData: PoolRequest = {
                type: formData.type === 'CTFD' ? 'SHARED' : formData.type!,
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
                    // For SHARED/CTFD pools, include mainUserId
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

    // Team management functions
    function addTeam() {
        if (!newTeamName.trim() || teams.includes(newTeamName.trim())) return;
        
        teams = [...teams, newTeamName.trim()];
        teamUsers[newTeamName.trim()] = '';
        newTeamName = '';
    }

    function removeTeam(teamName: string) {
        teams = teams.filter(t => t !== teamName);
        delete teamUsers[teamName];
        // Rebuild bulkUserInput to remove lines for the deleted team
        const lines: string[] = [];
        if (teams.length > 0) {
            for (const team of teams) {
                const users = teamUsers[team]?.trim();
                if (users) {
                    for (const user of users.split('\n').map(u => u.trim()).filter(u => u)) {
                        lines.push(`${user}, ${team}`);
                    }
                }
            }
        } else {
            const users = teamUsers['_no_teams']?.trim();
            if (users) {
                for (const user of users.split('\n').map(u => u.trim()).filter(u => u)) {
                    lines.push(user);
                }
            }
        }
        formData.bulkUserInput = lines.join('\n');
    }

    function updateTeamUsers(teamName: string, users: string) {
        teamUsers[teamName] = users;
    }

    function getDialogUserCount(): number {
        let count = 0;
        if (teams.length > 0) {
            for (const t of teams) {
                count += (teamUsers[t] || '').split('\n').filter(l => l.trim()).length;
            }
        } else {
            count = (teamUsers['_no_teams'] || '').split('\n').filter(l => l.trim()).length;
        }
        return count;
    }

    function applyTeamData() {
        const lines: string[] = [];
        
        if (teams.length > 0) {
            // With teams: format as "Username, Team"
            for (const team of teams) {
                const users = teamUsers[team]?.trim();
                if (users) {
                    const userList = users.split('\n').map(u => u.trim()).filter(u => u);
                    for (const user of userList) {
                        lines.push(`${user}, ${team}`);
                    }
                }
            }
        } else {
            // Without teams: just usernames
            const users = teamUsers['_no_teams']?.trim();
            if (users) {
                const userList = users.split('\n').map(u => u.trim()).filter(u => u);
                for (const user of userList) {
                    lines.push(user);
                }
            }
        }
        
        formData.bulkUserInput = lines.join('\n');
        assignUsersDialogOpen = false;
    }

    // === Shared pool functions ===

    function toggleMainUser(userId: string) {
        if (selectedMainUsers.includes(userId)) {
            // Clean up team assignments for users under this main user
            const usersForMainUser = (mainUserUsers[userId] || '').split('\n').map(l => l.trim()).filter(l => l);
            for (const user of usersForMainUser) {
                delete userTeamAssignments[user];
            }
            userTeamAssignments = { ...userTeamAssignments };
            selectedMainUsers = selectedMainUsers.filter(u => u !== userId);
            delete mainUserUsers[userId];
            // Rebuild bulkUserInput without this main user's entries
            applySharedData();
        } else {
            selectedMainUsers = [...selectedMainUsers, userId];
            mainUserUsers[userId] = '';
        }
    }

    function getMainUserDialogUserCount(): number {
        let count = 0;
        for (const mu of selectedMainUsers) {
            count += (mainUserUsers[mu] || '').split('\n').filter(l => l.trim()).length;
        }
        return count;
    }

    function getAllSharedUsers(): { user: string; mainUserId: string }[] {
        const users: { user: string; mainUserId: string }[] = [];
        for (const mu of selectedMainUsers) {
            const text = mainUserUsers[mu] || '';
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            for (const line of lines) {
                users.push({ user: line, mainUserId: mu });
            }
        }
        return users;
    }

    function addSharedTeam() {
        if (!sharedNewTeamName.trim() || sharedTeams.includes(sharedNewTeamName.trim())) return;
        sharedTeams = [...sharedTeams, sharedNewTeamName.trim()];
        sharedNewTeamName = '';
    }

    function removeSharedTeam(teamName: string) {
        sharedTeams = sharedTeams.filter(t => t !== teamName);
        // Remove team assignments for this team
        for (const [user, team] of Object.entries(userTeamAssignments)) {
            if (team === teamName) {
                delete userTeamAssignments[user];
            }
        }
        userTeamAssignments = { ...userTeamAssignments };
        if (selectedTeamForAssignment === teamName) {
            selectedTeamForAssignment = sharedTeams[0] || '';
        }
        // Rebuild bulkUserInput without the deleted team assignments
        applySharedData();
    }

    function toggleUserTeam(userName: string) {
        if (!selectedTeamForAssignment) return;
        if (userTeamAssignments[userName] === selectedTeamForAssignment) {
            delete userTeamAssignments[userName];
            userTeamAssignments = { ...userTeamAssignments };
        } else {
            userTeamAssignments = { ...userTeamAssignments, [userName]: selectedTeamForAssignment };
        }
    }

    function assignRemainingToTeam() {
        if (!selectedTeamForAssignment) return;
        const allUsers = getAllSharedUsers();
        for (const u of allUsers) {
            if (!userTeamAssignments[u.user]) {
                userTeamAssignments[u.user] = selectedTeamForAssignment;
            }
        }
        userTeamAssignments = { ...userTeamAssignments };
    }

    function getSharedUserCount(): number {
        return getAllSharedUsers().length;
    }

    function applySharedData() {
        const allUsers = getAllSharedUsers();
        const lines: string[] = [];
        for (const u of allUsers) {
            const team = userTeamAssignments[u.user] || '';
            if (team) {
                lines.push(`${u.user}, ${u.mainUserId}, ${team}`);
            } else {
                lines.push(`${u.user}, ${u.mainUserId}`);
            }
        }
        formData.bulkUserInput = lines.join('\n');
    }

    // === CTFd pool functions ===

    function selectCtfdUser(userId: string) {
        selectedCtfdUser = userId;
        selectCtfdUserDialogOpen = false;
    }

    function getCtfdDialogUserCount(): number {
        return (ctfdUserInput || '').split('\n').filter(l => l.trim()).length;
    }

    function applyCtfdData() {
        if (!selectedCtfdUser) return;
        const users = (ctfdUserInput || '').split('\n').map(l => l.trim()).filter(l => l);
        const lines = users.map(u => `${u}, ${selectedCtfdUser}`);
        formData.bulkUserInput = lines.join('\n');
        ctfdAssignUsersDialogOpen = false;
    }

    function isFormValid(): boolean {
        // For CTFD dev mode, only validate note
        if (formData.type === 'CTFD' && formData.isDev) {
            return formData.note.trim().length > 0 && formData.note.length <= 30;
        }
        
        if (!formData.type || !formData.topologyId) {
            return false;
        }
        
        if (!formData.note.trim()) {
            return false;
        }
        
        if (formData.note.length > 30) {
            return false;
        }
        
        if (formData.type === 'INDIVIDUAL') {
            return formData.bulkUserInput.trim().length > 0;
        }
        
        if (formData.type === 'SHARED' || formData.type === 'CTFD') {
            if (!formData.bulkUserInput.trim()) {
                return false;
            }
            
            const users = parseBulkUsers(formData.bulkUserInput);
            // For SHARED/CTFD pools, check that all users have mainUserId
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
    
    <div class="flex-1 min-h-0 w-full overflow-auto">
        <div class="max-w-7xl mx-auto">
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <!-- Step 1: Pool Type Selection -->
                <Card.Root class="h-full min-h-[39rem] flex flex-col">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 1: Select Pool Type</Card.Title>
                        <Card.Description class="text-sm">Choose the type of pool you want to create</Card.Description>
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

                            <button
                                class="w-full p-6 border-2 rounded-lg transition-all min-h-[8.5rem] {formData.type === 'CTFD' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                                onclick={() => handleTypeChange('CTFD')}
                            >
                                <div class="text-center h-full flex flex-col justify-center">
                                    <h3 class="font-semibold mb-2 text-lg">CTFd</h3>
                                    <p class="text-sm text-muted-foreground">Users share CTFd user's range</p>
                                    <div class="mt-3 min-h-[1.5rem] flex items-center justify-center">
                                        {#if formData.type === 'CTFD'}
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
                <Card.Root class="h-full min-h-[32rem] flex flex-col {!formData.type || (formData.type === 'CTFD' && formData.isDev) ? 'opacity-50 pointer-events-none' : ''}">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 2: Select users</Card.Title>
                        <Card.Description class="text-sm">
                            {#if formData.type === 'INDIVIDUAL'}
                                Enter pool users and teams
                            {:else if formData.type === 'SHARED'}
                                Enter main user and pool users and teams
                            {:else if formData.type === 'CTFD'}
                                Enter CTFd user and pool users
                            {:else}
                                Select a pool type first
                            {/if}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-3 p-6 flex-1 flex flex-col">


                        <!-- Team Management Buttons (for INDIVIDUAL pools only) -->
                        {#if formData.type === 'INDIVIDUAL'}
                            <div class="space-y-2">
                                <div class="text-sm font-medium">User and Team Management</div>
                                <div class="flex flex-col gap-2">
                                    <Button 
                                        variant="outline" 
                                        onclick={() => teamsDialogOpen = true}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <Users class="h-4 w-4" />
                                        Manage Teams
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onclick={() => assignUsersDialogOpen = true}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <UserCheck class="h-4 w-4" />
                                        Assign Users
                                    </Button>
                                </div>
                                <div class="min-h-[1.25rem] flex items-center mt-1">
                                    <p class="text-xs text-muted-foreground">
                                        {parseBulkUsers(formData.bulkUserInput).length} user(s) parsed
                                    </p>
                                </div>
                            </div>
                        {/if}

                        <!-- Users and Teams Input (for SHARED pools - button-driven) -->
                        {#if formData.type === 'SHARED'}
                            <div class="space-y-2">
                                <div class="text-sm font-medium">Main Users & User Management</div>
                                <div class="flex flex-col gap-2">
                                    <Button 
                                        variant="outline" 
                                        onclick={() => manageMainUsersDialogOpen = true}
                                        disabled={mainUsersLoading}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <Users class="h-4 w-4" />
                                        {mainUsersLoading ? 'Loading Main Users...' : 'Manage Main Users'}
                                        {#if selectedMainUsers.length > 0}
                                            <Badge class="ml-auto">{selectedMainUsers.length}</Badge>
                                        {/if}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onclick={() => assignToMainUsersDialogOpen = true}
                                        disabled={selectedMainUsers.length === 0}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <UserCheck class="h-4 w-4" />
                                        Assign Users to Main Users
                                    </Button>
                                </div>
                            </div>
                            <div class="space-y-2 pt-2 border-t">
                                <div class="text-sm font-medium">Team Management</div>
                                <div class="flex flex-col gap-2">
                                    <Button 
                                        variant="outline" 
                                        onclick={() => sharedTeamsDialogOpen = true}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <Users class="h-4 w-4" />
                                        Manage Teams
                                        {#if sharedTeams.length > 0}
                                            <Badge class="ml-auto">{sharedTeams.length}</Badge>
                                        {/if}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onclick={() => {
                                            if (sharedTeams.length > 0 && !selectedTeamForAssignment) {
                                                selectedTeamForAssignment = sharedTeams[0];
                                            }
                                            assignToTeamsDialogOpen = true;
                                        }}
                                        disabled={sharedTeams.length === 0 || getSharedUserCount() === 0}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <UserCheck class="h-4 w-4" />
                                        Assign Users to Teams
                                    </Button>
                                </div>
                            </div>
                            <div class="min-h-[1.25rem] flex items-center mt-1">
                                <p class="text-xs text-muted-foreground">
                                    {parseBulkUsers(formData.bulkUserInput).length} user(s) parsed
                                </p>
                            </div>
                        {/if}

                        <!-- CTFd pool buttons -->
                        {#if formData.type === 'CTFD'}
                            <div class="space-y-2">
                                <div class="text-sm font-medium">CTFd User & User Management</div>
                                <div class="flex flex-col gap-2">
                                    <Button 
                                        variant="outline" 
                                        onclick={() => selectCtfdUserDialogOpen = true}
                                        disabled={mainUsersLoading}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <Users class="h-4 w-4" />
                                        {mainUsersLoading ? 'Loading CTFd Users...' : selectedCtfdUser ? `CTFd User: ${selectedCtfdUser}` : 'Select CTFd User'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onclick={() => ctfdAssignUsersDialogOpen = true}
                                        disabled={!selectedCtfdUser}
                                        class="w-full flex items-center gap-2"
                                    >
                                        <UserCheck class="h-4 w-4" />
                                        Assign Users
                                    </Button>
                                </div>
                                <div class="min-h-[1.25rem] flex items-center mt-1">
                                    <p class="text-xs text-muted-foreground">
                                        {parseBulkUsers(formData.bulkUserInput).length} user(s) parsed
                                    </p>
                                </div>
                            </div>
                        {/if}

                        <!-- Check Users in Pools Button -->
                        <div class="mt-auto pt-3">
                            {#if formData.type}
                                <Button 
                                    variant="outline" 
                                    onclick={checkUsersInOtherPools}
                                    disabled={!formData.bulkUserInput.trim()}
                                    class="w-full flex items-center gap-2"
                                >
                                    <Search class="h-4 w-4" />
                                    Search Users
                                </Button>
                            {/if}
                        </div>
                    </Card.Content>
                </Card.Root>

                <!-- Step 3: Select Topology & Note -->
                <Card.Root class="h-full min-h-[32rem] flex flex-col {!formData.type ? 'opacity-50 pointer-events-none' : ''}">
                    <Card.Header class="pb-4">
                        <Card.Title class="text-xl">Step 3: Topology & Note</Card.Title>
                        <Card.Description class="text-sm">
                            {#if formData.type}
                                Choose the topology and add notes for your pool
                            {:else}
                                Select a pool type first
                            {/if}
                        </Card.Description>
                    </Card.Header>
                    <Card.Content class="space-y-6 p-6 flex-1 flex flex-col">
                        <div class="flex-1 space-y-6">
                            <div class="space-y-3 {formData.type === 'CTFD' && formData.isDev ? 'opacity-50 pointer-events-none' : ''}">
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
                                                disabled={formData.type === 'CTFD' && formData.isDev}
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
                                <div class="text-sm font-medium">Note * <span class="text-muted-foreground">(maximum 30 characters)</span></div>
                                <Input
                                    bind:value={formData.note}
                                    placeholder="Enter note..."
                                    maxlength={30}
                                    class="w-full"
                                />
                                <p class="text-xs text-muted-foreground">
                                    {formData.note.length}/30 characters
                                </p>
                            </div>

                            <!-- Dev Mode Toggle (only for CTFD) -->
                            {#if formData.type === 'CTFD'}
                                <div class="space-y-3 pt-2 border-t">
                                    <div class="text-sm font-medium">Development Mode</div>
                                    <label class="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            bind:checked={formData.isDev}
                                            class="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                                        />
                                        <span class="text-sm">Create CTFd development pool</span>
                                    </label>
                                </div>
                            {/if}
                        </div>

                        <div class="mt-auto pt-6">
                            <div class="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                                <strong>Pool Creator:</strong> {createdBy}
                            </div>
                        </div>
                    </Card.Content>
                </Card.Root>
            </div>
        </div>
    </div>

    <!-- Team Management Dialogs -->
    <!-- Manage Teams Dialog -->
    <Dialog.Root bind:open={teamsDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title>Manage Teams</Dialog.Title>
            </Dialog.Header>
            <div class="space-y-4">
                <div class="flex gap-2">
                    <Input
                        bind:value={newTeamName}
                        placeholder="Enter team name..."
                        class="flex-1"
                        onkeydown={(e) => {
                            if (e.key === 'Enter') {
                                addTeam();
                            }
                        }}
                    />
                    <Button 
                        onclick={addTeam}
                        disabled={!newTeamName.trim() || teams.includes(newTeamName.trim())}
                        class="whitespace-nowrap"
                    >
                        Add Team
                    </Button>
                </div>
                
                <div class="space-y-2 max-h-60 overflow-auto">
                    <div class="text-sm font-medium">Teams ({teams.length})</div>
                    {#each teams as team (team)}
                        <div class="flex items-center justify-between p-2 border rounded">
                            <span class="text-sm">{team}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={() => removeTeam(team)}
                                class="h-6 w-6 p-0"
                            >
                                <X class="h-3 w-3" />
                            </Button>
                        </div>
                    {:else}
                        <p class="text-sm text-muted-foreground">No teams created yet</p>
                    {/each}
                </div>
            </div>
            <Dialog.Footer>
                <Button variant="outline" onclick={() => teamsDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Assign Users to Teams Dialog -->
    <Dialog.Root bind:open={assignUsersDialogOpen}>
        <Dialog.Content class="max-w-[90vw] max-h-[85vh] p-0 flex flex-col">
            <Dialog.Header class="px-6 py-4 border-b flex-shrink-0">
                <Dialog.Title class="text-xl font-semibold">Assign Users</Dialog.Title>
            </Dialog.Header>
            <div class="flex-1 overflow-auto p-6">
                {#if teams.length > 1}
                    <div class="flex gap-4">
                        {#each teams as team (team)}
                            <div class="flex flex-col border rounded-lg bg-card w-64 flex-shrink-0">
                                <div class="px-4 py-3 border-b bg-muted/50 rounded-t-lg">
                                    <h3 class="font-medium text-sm truncate" title={team}>{team}</h3>
                                </div>
                                <div class="p-3">
                                    <textarea
                                        bind:value={teamUsers[team]}
                                        placeholder="One user per line..."
                                        rows="14"
                                        class="w-full p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none rounded-md h-[320px]"
                                        oninput={(e) => updateTeamUsers(team, e.currentTarget.value)}
                                    ></textarea>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else if teams.length === 1}
                    <div class="flex flex-col border rounded-lg bg-card w-full">
                        <div class="px-4 py-3 border-b bg-muted/50 rounded-t-lg">
                            <h3 class="font-medium text-sm">{teams[0]}</h3>
                        </div>
                        <div class="p-3">
                            <textarea
                                bind:value={teamUsers[teams[0]]}
                                placeholder="One user per line..."
                                rows="14"
                                class="w-full p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none rounded-md h-[320px]"
                                oninput={(e) => updateTeamUsers(teams[0], e.currentTarget.value)}
                            ></textarea>
                        </div>
                    </div>
                {:else}
                    <div class="flex flex-col w-full">
                        <textarea
                            bind:value={teamUsers['_no_teams']}
                            placeholder="One user per line..."
                            rows="14"
                            class="w-full p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none rounded-md h-[320px]"
                            oninput={(e) => updateTeamUsers('_no_teams', e.currentTarget.value)}
                        ></textarea>
                    </div>
                {/if}
            </div>
            <Dialog.Footer class="px-6 py-4 border-t flex-shrink-0">
                <div class="flex items-center justify-between w-full">
                    <div class="text-xs text-muted-foreground">
                        {getDialogUserCount()} user{getDialogUserCount() === 1 ? '' : 's'}
                    </div>
                    <div class="flex gap-3">
                        <Button variant="outline" onclick={() => assignUsersDialogOpen = false}>Cancel</Button>
                        <Button onclick={applyTeamData}>Apply Users</Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- SHARED POOL DIALOGS -->

    <!-- 1. Manage Main Users Dialog -->
    <Dialog.Root bind:open={manageMainUsersDialogOpen}>
        <Dialog.Content class="max-w-lg max-h-[80vh] p-0 flex flex-col">
            <Dialog.Header class="px-6 py-4 border-b flex-shrink-0">
                <Dialog.Title>Manage Main Users</Dialog.Title>
            </Dialog.Header>
            <div class="flex-1 overflow-auto p-6">
                <div class="space-y-2">
                    {#if mainUsersData.length > 0}
                        {#each mainUsersData as userId (userId)}
                            <button
                                class="w-full flex items-center justify-between p-3 border rounded-lg transition-all {selectedMainUsers.includes(userId) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                                onclick={() => toggleMainUser(userId)}
                            >
                                <span class="text-sm font-medium">{userId}</span>
                                {#if selectedMainUsers.includes(userId)}
                                    <Check class="h-4 w-4 text-primary" />
                                {/if}
                            </button>
                        {/each}
                    {:else}
                        <p class="text-sm text-muted-foreground text-center py-4">No main users available</p>
                    {/if}
                </div>
            </div>
            <Dialog.Footer class="px-6 py-4 border-t flex-shrink-0">
                <div class="flex items-center justify-between w-full">
                    <div class="text-xs text-muted-foreground">
                        {selectedMainUsers.length} selected
                    </div>
                    <Button variant="outline" onclick={() => manageMainUsersDialogOpen = false}>Close</Button>
                </div>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- 2. Assign Users to Main Users Dialog -->
    <Dialog.Root bind:open={assignToMainUsersDialogOpen}>
        <Dialog.Content class="max-w-[90vw] max-h-[85vh] p-0 flex flex-col">
            <Dialog.Header class="px-6 py-4 border-b flex-shrink-0">
                <Dialog.Title class="text-xl font-semibold">Assign Users to Main Users</Dialog.Title>
            </Dialog.Header>
            <div class="flex-1 overflow-auto p-6">
                {#if selectedMainUsers.length > 1}
                    <div class="flex gap-4">
                        {#each selectedMainUsers as mu (mu)}
                            <div class="flex flex-col border rounded-lg bg-card w-64 flex-shrink-0">
                                <div class="px-4 py-3 border-b bg-muted/50 rounded-t-lg">
                                    <h3 class="font-medium text-sm truncate" title={mu}>{mu}</h3>
                                </div>
                                <div class="p-3">
                                    <textarea
                                        bind:value={mainUserUsers[mu]}
                                        placeholder="One user per line..."
                                        rows="14"
                                        class="w-full p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none rounded-md h-[320px]"
                                    ></textarea>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else if selectedMainUsers.length === 1}
                    <div class="flex flex-col border rounded-lg bg-card w-full">
                        <div class="px-4 py-3 border-b bg-muted/50 rounded-t-lg">
                            <h3 class="font-medium text-sm">{selectedMainUsers[0]}</h3>
                        </div>
                        <div class="p-3">
                            <textarea
                                bind:value={mainUserUsers[selectedMainUsers[0]]}
                                placeholder="One user per line..."
                                rows="14"
                                class="w-full p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none rounded-md h-[320px]"
                            ></textarea>
                        </div>
                    </div>
                {:else}
                    <div class="flex items-center justify-center h-48 text-muted-foreground text-sm">
                        No main users selected. Use "Manage Main Users" first.
                    </div>
                {/if}
            </div>
            <Dialog.Footer class="px-6 py-4 border-t flex-shrink-0">
                <div class="flex items-center justify-between w-full">
                    <div class="text-xs text-muted-foreground">
                        {getMainUserDialogUserCount()} user{getMainUserDialogUserCount() === 1 ? '' : 's'}
                    </div>
                    <div class="flex gap-3">
                        <Button variant="outline" onclick={() => assignToMainUsersDialogOpen = false}>Cancel</Button>
                        <Button onclick={() => { applySharedData(); assignToMainUsersDialogOpen = false; }}>Apply Users</Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- 3. Manage Teams Dialog (Shared) -->
    <Dialog.Root bind:open={sharedTeamsDialogOpen}>
        <Dialog.Content class="max-w-lg">
            <Dialog.Header>
                <Dialog.Title>Manage Teams</Dialog.Title>
            </Dialog.Header>
            <div class="space-y-4">
                <div class="flex gap-2">
                    <Input
                        bind:value={sharedNewTeamName}
                        placeholder="Enter team name..."
                        class="flex-1"
                        onkeydown={(e) => {
                            if (e.key === 'Enter') {
                                addSharedTeam();
                            }
                        }}
                    />
                    <Button 
                        onclick={addSharedTeam}
                        disabled={!sharedNewTeamName.trim() || sharedTeams.includes(sharedNewTeamName.trim())}
                        class="whitespace-nowrap"
                    >
                        Add Team
                    </Button>
                </div>
                
                <div class="space-y-2 max-h-60 overflow-auto">
                    <div class="text-sm font-medium">Teams ({sharedTeams.length})</div>
                    {#each sharedTeams as team (team)}
                        <div class="flex items-center justify-between p-2 border rounded">
                            <span class="text-sm">{team}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onclick={() => removeSharedTeam(team)}
                                class="h-6 w-6 p-0"
                            >
                                <X class="h-3 w-3" />
                            </Button>
                        </div>
                    {:else}
                        <p class="text-sm text-muted-foreground">No teams created yet</p>
                    {/each}
                </div>
            </div>
            <Dialog.Footer>
                <Button variant="outline" onclick={() => sharedTeamsDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- 4. Assign Users to Teams Dialog (Shared) -->
    <Dialog.Root bind:open={assignToTeamsDialogOpen}>
        <Dialog.Content class="max-w-2xl max-h-[85vh] p-0 flex flex-col">
            <Dialog.Header class="px-6 py-4 border-b flex-shrink-0">
                <Dialog.Title class="text-xl font-semibold">Assign Users to Teams</Dialog.Title>
            </Dialog.Header>
            <div class="flex-1 overflow-hidden p-6 flex flex-col gap-4">
                <!-- Team selector -->
                <div class="space-y-2 flex-shrink-0">
                    <div class="text-sm font-medium">Select Team</div>
                    <div class="flex flex-wrap gap-2">
                        {#each sharedTeams as team (team)}
                            <button
                                class="px-3 py-1.5 text-sm rounded-md border transition-all {selectedTeamForAssignment === team ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/50'}"
                                onclick={() => selectedTeamForAssignment = team}
                            >
                                {team}
                                <span class="ml-1 opacity-70">({getAllSharedUsers().filter(u => userTeamAssignments[u.user] === team).length})</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Users list -->
                <div class="flex-1 min-h-0 flex flex-col gap-2">
                    <div class="flex items-center justify-between flex-shrink-0">
                        <div class="text-sm font-medium">Users</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={assignRemainingToTeam}
                            disabled={!selectedTeamForAssignment}
                            class="text-xs"
                        >
                            Assign remaining to {selectedTeamForAssignment || '...'}
                        </Button>
                    </div>
                    <div class="space-y-1 flex-1 min-h-0 overflow-auto">
                        {#each getAllSharedUsers() as user (user.user + user.mainUserId)}
                            <button
                                class="w-full flex items-center justify-between p-2.5 border rounded-lg transition-all text-left {userTeamAssignments[user.user] === selectedTeamForAssignment ? 'border-primary bg-primary/5' : userTeamAssignments[user.user] ? 'border-border bg-muted/30' : 'border-border hover:border-primary/50'}"
                                onclick={() => toggleUserTeam(user.user)}
                            >
                                <div class="flex flex-col">
                                    <span class="text-sm">{user.user}</span>
                                    <span class="text-xs text-muted-foreground">Main: {user.mainUserId}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    {#if userTeamAssignments[user.user]}
                                        <Badge variant={userTeamAssignments[user.user] === selectedTeamForAssignment ? 'default' : 'secondary'}>
                                            {userTeamAssignments[user.user]}
                                        </Badge>
                                    {:else}
                                        <span class="text-xs text-muted-foreground">Unassigned</span>
                                    {/if}
                                </div>
                            </button>
                        {:else}
                            <p class="text-sm text-muted-foreground text-center py-4">No users assigned to main users yet</p>
                        {/each}
                    </div>
                </div>
            </div>
            <Dialog.Footer class="px-6 py-4 border-t flex-shrink-0">
                <div class="flex items-center justify-between w-full">
                    <div class="text-xs text-muted-foreground">
                        {Object.keys(userTeamAssignments).length}/{getAllSharedUsers().length} assigned
                    </div>
                    <div class="flex gap-3">
                        <Button variant="outline" onclick={() => assignToTeamsDialogOpen = false}>Cancel</Button>
                        <Button onclick={() => { applySharedData(); assignToTeamsDialogOpen = false; }}>Apply</Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- CTFD POOL DIALOGS -->

    <!-- Select CTFd User Dialog -->
    <Dialog.Root bind:open={selectCtfdUserDialogOpen}>
        <Dialog.Content class="max-w-lg max-h-[80vh] p-0 flex flex-col">
            <Dialog.Header class="px-6 py-4 border-b flex-shrink-0">
                <Dialog.Title>Select CTFd User</Dialog.Title>
            </Dialog.Header>
            <div class="flex-1 overflow-auto p-6">
                <div class="space-y-2">
                    {#if mainUsersData.length > 0}
                        {#each mainUsersData as userId (userId)}
                            <button
                                class="w-full flex items-center justify-between p-3 border rounded-lg transition-all {selectedCtfdUser === userId ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}"
                                onclick={() => selectCtfdUser(userId)}
                            >
                                <span class="text-sm font-medium">{userId}</span>
                                {#if selectedCtfdUser === userId}
                                    <Check class="h-4 w-4 text-primary" />
                                {/if}
                            </button>
                        {/each}
                    {:else}
                        <p class="text-sm text-muted-foreground text-center py-4">No CTFd users available</p>
                    {/if}
                </div>
            </div>
            <Dialog.Footer class="px-6 py-4 border-t flex-shrink-0">
                <Button variant="outline" onclick={() => selectCtfdUserDialogOpen = false}>Close</Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>

    <!-- Assign Users to CTFd User Dialog -->
    <Dialog.Root bind:open={ctfdAssignUsersDialogOpen}>
        <Dialog.Content class="max-w-[90vw] max-h-[85vh] p-0 flex flex-col">
            <Dialog.Header class="px-6 py-4 border-b flex-shrink-0">
                <Dialog.Title class="text-xl font-semibold">Assign Users</Dialog.Title>
            </Dialog.Header>
            <div class="flex-1 overflow-auto p-6">
                <div class="flex flex-col border rounded-lg bg-card w-full">
                    <div class="px-4 py-3 border-b bg-muted/50 rounded-t-lg">
                        <h3 class="font-medium text-sm">{selectedCtfdUser}</h3>
                    </div>
                    <div class="p-3">
                        <textarea
                            bind:value={ctfdUserInput}
                            placeholder="One user per line..."
                            rows="14"
                            class="w-full p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none rounded-md h-[320px]"
                        ></textarea>
                    </div>
                </div>
            </div>
            <Dialog.Footer class="px-6 py-4 border-t flex-shrink-0">
                <div class="flex items-center justify-between w-full">
                    <div class="text-xs text-muted-foreground">
                        {getCtfdDialogUserCount()} user{getCtfdDialogUserCount() === 1 ? '' : 's'}
                    </div>
                    <div class="flex gap-3">
                        <Button variant="outline" onclick={() => ctfdAssignUsersDialogOpen = false}>Cancel</Button>
                        <Button onclick={applyCtfdData}>Apply Users</Button>
                    </div>
                </div>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>


</div>
