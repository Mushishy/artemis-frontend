<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Plus, Upload, AlertCircle, CheckCircle2, X, Download } from 'lucide-svelte';
	import type { Role } from './data.js';
	import type { PageData } from './$types';
	import { 
		installRole, 
		installCollection, 
		installRoleFromFile,
		type InstallRoleRequest,
		type InstallCollectionRequest
	} from '$lib/api/roles.client';

	let { data }: { data: PageData } = $props();
	
	// State management
	let roles = $state(data.roles);
	let installDialogOpen = $state(false);
	let selectedFile: File | null = $state(null);
	let fileInput = $state<HTMLInputElement>();
	let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	
	// Form state
	let installType: 'role' | 'collection' | 'file' = $state('role');
	let roleName = $state('');
	let roleVersion = $state('');
	let collectionName = $state('');
	let collectionVersion = $state('');
	let forceInstall = $state(true);
	let globalInstall = $state(true);

	const headers: { key: keyof Role; label: string; sortable?: boolean }[] = [
		{ key: 'name', label: 'Role Name', sortable: true },
		{ key: 'version', label: 'Role Version', sortable: true },
		{ key: 'type', label: 'Role Type', sortable: true },
		{ key: 'global', label: 'Global Role', sortable: true }
	];

	function showAlert(message: string, type: 'success' | 'error') {
		alertMessage = { message, type };
		setTimeout(() => {
			alertMessage = null;
		}, 5000);
	}

	function hideAlert() {
		alertMessage = null;
	}

	function handleInstallNew() {
		// Reset form
		installType = 'role';
		roleName = '';
		roleVersion = '';
		collectionName = '';
		collectionVersion = '';
		forceInstall = true;
		globalInstall = true;
		selectedFile = null;
		if (fileInput) {
			fileInput.value = '';
		}
		installDialogOpen = true;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			selectedFile = target.files[0];
		}
	}

	async function handleInstall() {
		try {
			if (installType === 'role') {
				if (!roleName.trim() || !roleVersion.trim()) {
					showAlert('Please enter role name and version', 'error');
					return;
				}
				
				const request: InstallRoleRequest = {
					role: roleName.trim(),
					version: roleVersion.trim(),
					force: forceInstall,
					action: 'install',
					global: globalInstall
				};
				
				await installRole(request);
				showAlert(`Role "${roleName}" installed successfully`, 'success');
			} else if (installType === 'collection') {
				if (!collectionName.trim() || !collectionVersion.trim()) {
					showAlert('Please enter collection name and version', 'error');
					return;
				}
				
				const request: InstallCollectionRequest = {
					collection: collectionName.trim(),
					version: collectionVersion.trim(),
					force: forceInstall
				};
				
				await installCollection(request);
				showAlert(`Collection "${collectionName}" installed successfully`, 'success');
			} else if (installType === 'file') {
				if (!selectedFile) {
					showAlert('Please select a file', 'error');
					return;
				}
				
				await installRoleFromFile(selectedFile, forceInstall, globalInstall);
				showAlert(`Role from file "${selectedFile.name}" installed successfully`, 'success');
			}
			
			closeInstallDialog();
			// Refresh the roles list
			location.reload();
		} catch (error) {
			console.error('Failed to install:', error);
			const errorMessage = error instanceof Error ? error.message : 'Installation failed';
			showAlert(errorMessage, 'error');
		}
	}

	function closeInstallDialog() {
		installDialogOpen = false;
		roleName = '';
		roleVersion = '';
		collectionName = '';
		collectionVersion = '';
		selectedFile = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
	<div class="mb-6 flex items-center justify-between flex-shrink-0">
		<div>
			<h1 class="text-3xl font-bold">Roles</h1>
			<p class="text-sm text-muted-foreground">
				{data.roles.length} role{data.roles.length !== 1 ? 's' : ''} available
			</p>
		</div>
		<Button onclick={handleInstallNew} class="flex items-center gap-2">
			<Plus class="h-4 w-4" />
			Install Role or Collection
		</Button>
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
			data={roles} 
			{headers} 
			maxHeight="calc(100% - 2rem)"
		/>
	</div>
</div>

<!-- Install Dialog -->
<Dialog.Root bind:open={installDialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Install Role or Collection</Dialog.Title>
			<Dialog.Description>
				Choose what you want to install: a role, collection, or role from file.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="space-y-6">
			<!-- Installation Type Selection -->
			<div class="space-y-3">
				<div class="text-sm font-medium">Installation Type</div>
				<div class="grid grid-cols-3 gap-4">
					<label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {installType === 'file' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
						<input type="radio" bind:group={installType} value="file" class="text-primary" />
						<span class="text-sm font-medium">From File</span>
					</label>
					<label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {installType === 'role' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
						<input type="radio" bind:group={installType} value="role" class="text-primary" />
						<span class="text-sm font-medium">Role</span>
					</label>
					<label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {installType === 'collection' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
						<input type="radio" bind:group={installType} value="collection" class="text-primary" />
						<span class="text-sm font-medium">Collection</span>
					</label>
				</div>
			</div>

			<!-- Content Area with Fixed Height -->
			<div class="min-h-[12rem]">
			{#if installType === 'role'}
				<!-- Role Installation -->
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="role-name" class="text-sm font-medium">Role Name</label>
						<Input
							id="role-name"
							bind:value={roleName}
							placeholder="e.g., geerlingguy.docker"
							class="w-full"
						/>
					</div>
					<div class="space-y-2">
						<label for="role-version" class="text-sm font-medium">Version</label>
						<Input
							id="role-version"
							bind:value={roleVersion}
							placeholder="e.g., 7.4.7"
							class="w-full"
						/>
					</div>
					<div class="flex items-center space-x-4">
						<label class="flex items-center space-x-2">
							<input type="checkbox" bind:checked={forceInstall} class="rounded" />
							<span class="text-sm">Force install</span>
						</label>
						<label class="flex items-center space-x-2">
							<input type="checkbox" bind:checked={globalInstall} class="rounded" />
							<span class="text-sm">Global install</span>
						</label>
					</div>
				</div>
			{:else if installType === 'collection'}
				<!-- Collection Installation -->
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="collection-name" class="text-sm font-medium">Collection Name</label>
						<Input
							id="collection-name"
							bind:value={collectionName}
							placeholder="e.g., maxhoesel.smallstep"
							class="w-full"
						/>
					</div>
					<div class="space-y-2">
						<label for="collection-version" class="text-sm font-medium">Version</label>
						<Input
							id="collection-version"
							bind:value={collectionVersion}
							placeholder="e.g., 0.23.1"
							class="w-full"
						/>
					</div>
					<div class="flex items-center">
						<label class="flex items-center space-x-2">
							<input type="checkbox" bind:checked={forceInstall} class="rounded" />
							<span class="text-sm">Force install</span>
						</label>
					</div>
				</div>
			{:else if installType === 'file'}
				<!-- File Installation -->
				<div class="space-y-4">
					<div class="space-y-2">
						<label for="file-upload" class="text-sm font-medium">Select Role Archive</label>
						<p class="text-xs text-muted-foreground">
							Upload TAR files containing the role
						</p>
						<input
							bind:this={fileInput}
							id="file-upload"
							type="file"
							accept=".tar"
							onchange={handleFileSelect}
							class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium"
						/>
						<div class="text-xs text-muted-foreground">
							<p>Supported format: TAR files (.tar)</p>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<label class="flex items-center space-x-2">
							<input type="checkbox" bind:checked={forceInstall} class="rounded" />
							<span class="text-sm">Force install</span>
						</label>
						<label class="flex items-center space-x-2">
							<input type="checkbox" bind:checked={globalInstall} class="rounded" />
							<span class="text-sm">Global install</span>
						</label>
					</div>
				</div>
			{/if}
			</div>
		</div>

		<Dialog.Footer class="flex gap-2">
			<Button variant="outline" onclick={closeInstallDialog}>
				Cancel
			</Button>
			<Button 
				onclick={handleInstall} 
				disabled={
					(installType === 'role' && (!roleName.trim() || !roleVersion.trim())) ||
					(installType === 'collection' && (!collectionName.trim() || !collectionVersion.trim())) ||
					(installType === 'file' && !selectedFile)
				}
				class="flex items-center gap-2"
			>
				<Download class="h-4 w-4" />
				Install
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>