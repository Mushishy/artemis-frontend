<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Plus, Upload, AlertCircle, CheckCircle2, X } from 'lucide-svelte';
	import type { Scenario } from './data.js';
	import { uploadScenario, removeScenario, downloadScenario } from './data.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let scenarios = $state(data.scenarios);
	let uploadDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let editingScenario: Scenario | null = $state(null);
	let deletingScenario: Scenario | null = $state(null);
	let selectedFile: File | null = $state(null);
	let fileInput = $state<HTMLInputElement>();
	let alertMessage = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	const headers: { key: keyof Scenario; label: string; sortable?: boolean }[] = [
		{ key: 'Name', label: 'Scenario Name', sortable: true },
		{ key: 'ID', label: 'Scenario ID', sortable: true },
		{ key: 'Created', label: 'Created', sortable: true }
	];

	function handleEdit(scenario: Scenario) {
		editingScenario = scenario;
		uploadDialogOpen = true;
	}

	function handleDelete(scenario: Scenario) {
		deletingScenario = scenario;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!deletingScenario) return;
		
		try {
			await removeScenario(deletingScenario.ID);
			scenarios = scenarios.filter(s => s.ID !== deletingScenario.ID);
			showAlert('success', `Scenario "${deletingScenario.Name}" deleted successfully`);
		} catch (error) {
			showAlert('error', 'Failed to delete scenario');
		} finally {
			deleteDialogOpen = false;
			deletingScenario = null;
		}
	}

	async function handleDownload(scenario: Scenario) {
		try {
			await downloadScenario(scenario.ID);
			showAlert('success', `Scenario "${scenario.Name}" downloaded successfully`);
		} catch (error) {
			showAlert('error', 'Failed to download scenario');
		}
	}

	function handleCreateNew() {
		editingScenario = null;
		uploadDialogOpen = true;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			selectedFile = target.files[0];
		}
	}

	async function handleUpload() {
		if (!selectedFile) {
			showAlert('error', 'Please select a file');
			return;
		}

		try {
			const result = await uploadScenario(selectedFile, editingScenario?.ID);
			const action = editingScenario ? 'updated' : 'created';
			showAlert('success', `Scenario ${action} successfully`);
			// Refresh the scenarios list
			location.reload();
		} catch (error) {
			showAlert('error', `Failed to ${editingScenario ? 'update' : 'create'} scenario`);
		}
	}

	function closeDialog() {
		uploadDialogOpen = false;
		editingScenario = null;
		selectedFile = null;
		if (fileInput) {
			fileInput.value = '';
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
			<h1 class="text-3xl font-bold">Scenarios</h1>
			<p class="text-sm text-muted-foreground">
				{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} available
			</p>
		</div>
		<Button onclick={handleCreateNew} class="flex items-center gap-2">
			<Plus class="h-4 w-4" />
			Create New Scenario
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
			data={scenarios} 
			{headers} 
			maxHeight="calc(100% - 2rem)"
			showActions={true}
			onEdit={handleEdit}
			onDelete={handleDelete}
			onDownload={handleDownload}
		/>
	</div>
</div>

<!-- Upload Dialog -->
<Dialog.Root bind:open={uploadDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				{editingScenario ? 'Update Scenario' : 'Create New Scenario'}
			</Dialog.Title>
			<Dialog.Description>
				{#if editingScenario}
					Upload a new .zip file to update "{editingScenario.Name}".
				{:else}
					Upload a .zip file to create a new scenario.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		
		{#if editingScenario}
			<div class="mb-4 p-3 bg-muted rounded-md">
				<p class="text-sm font-medium">Currently updating:</p>
				<p class="text-sm text-muted-foreground">{editingScenario.Name}</p>
				<p class="text-xs text-muted-foreground">ID: {editingScenario.ID}</p>
			</div>
		{/if}

		<div class="space-y-4">
			<div>
				<label for="file-upload" class="block text-sm font-medium mb-2">
					Select .zip file:
				</label>
				<input
					bind:this={fileInput}
					id="file-upload"
					type="file"
					accept=".zip"
					onchange={handleFileSelect}
					class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium"
				/>
			</div>
		</div>

		<Dialog.Footer class="flex gap-2">
			<Button variant="outline" onclick={closeDialog}>
				Cancel
			</Button>
			<Button onclick={handleUpload} disabled={!selectedFile} class="flex items-center gap-2">
				<Upload class="h-4 w-4" />
				{editingScenario ? 'Update' : 'Upload'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				{#if deletingScenario}
					This action cannot be undone. This will permanently delete the scenario 
					<strong>"{deletingScenario.Name}"</strong> and remove it from the system.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { deleteDialogOpen = false; deletingScenario = null; }}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDelete} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>