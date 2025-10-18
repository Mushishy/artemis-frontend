<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Plus, Upload, AlertCircle, CheckCircle2, X } from 'lucide-svelte';
	import type { TopologyDisplay } from '$lib/api/types';
	import { createOrUpdateTopology, deleteTopology, downloadTopologyFile } from '$lib/api/client/topology.client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let topologies = $state(data.topologies);
	let uploadDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let editingTopology: TopologyDisplay | null = $state(null);
	let deletingTopology: TopologyDisplay | null = $state(null);
	let selectedFile: File | null = $state(null);
	let fileInput = $state<HTMLInputElement>();
	let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	const headers: { key: keyof TopologyDisplay; label: string; sortable?: boolean }[] = [
		{ key: 'Name', label: 'Topology Name', sortable: true },
		{ key: 'ID', label: 'Topology ID', sortable: true },
		{ key: 'Created', label: 'Created', sortable: true }
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

	function handleEdit(topology: TopologyDisplay) {
		editingTopology = topology;
		uploadDialogOpen = true;
	}

	function handleDelete(topology: TopologyDisplay) {
		deletingTopology = topology;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!deletingTopology) return;
		
		// Store topology info before clearing
		const topologyName = deletingTopology.Name;
		const topologyId = deletingTopology.ID;
		
		// Close dialog immediately
		deleteDialogOpen = false;
		deletingTopology = null;
		
		// Show initial deleting notification
		showAlert(`Deleting topology "${topologyName}"`, 'success');
		
		try {
			await deleteTopology(topologyId);
			topologies = topologies.filter(t => t.ID !== topologyId);
			showAlert(`Topology "${topologyName}" deleted successfully`, 'success');
		} catch (error: any) {
			console.error('Failed to delete topology:', error);
			
			let errorMessage = `Failed to delete topology "${topologyName}"`;
			if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			showAlert(errorMessage, 'error');
		}
	}

	async function handleDownload(topology: TopologyDisplay) {
		try {
			await downloadTopologyFile(topology.ID);
			showAlert(`Topology "${topology.Name}" downloaded successfully`, 'success');
		} catch (error: any) {
			console.error('Failed to download topology:', error);
			
			let errorMessage = `Failed to download topology "${topology.Name}"`;
			if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			} else if (error.message) {
				errorMessage = error.message;
			}
			
			showAlert(errorMessage, 'error');
		}
	}

	function handleCreateNew() {
		editingTopology = null;
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
			showAlert('Please select a file', 'error');
			return;
		}

		try {
			const result = await createOrUpdateTopology(selectedFile, editingTopology?.ID);
			
			if (editingTopology) {
				showAlert(`Topology "${editingTopology.Name || 'Unknown'}" updated successfully`, 'success');
			} else {
				showAlert(`Topology "${result.id || 'Unknown'}" created successfully`, 'success');
			}
			
			closeDialog();
			// Refresh the topologies list
			location.reload();
		} catch (error: any) {
			console.error('Failed to upload topology:', error);
			
			// Check for 400 error (topology being used by pool)
			if (error.response?.status === 400) {
				showAlert('Topology cannot be edited because it is being used by an active pool', 'error');
			} else {
				// Extract error message from API response
				let errorMessage = 'Failed to upload topology';
				if (error.response?.data) {
					if (typeof error.response.data === 'string') {
						errorMessage = error.response.data;
					} else if (error.response.data.error) {
						errorMessage = error.response.data.error;
					} else if (error.response.data.message) {
						errorMessage = error.response.data.message;
					}
				}
				showAlert(errorMessage, 'error');
			}
		}
	}

	function closeDialog() {
		uploadDialogOpen = false;
		editingTopology = null;
		selectedFile = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
	<div class="mb-6 flex items-center justify-between flex-shrink-0">
		<div>
			<h1 class="text-3xl font-bold">Topologies</h1>
			<p class="text-sm text-muted-foreground">
				{topologies.length} topolog{topologies.length !== 1 ? 'ies' : 'y'} available
			</p>
		</div>
		<Button onclick={handleCreateNew} class="flex items-center gap-2">
			<Plus class="h-4 w-4" />
			Create New Topology
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
			data={topologies} 
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
				{editingTopology ? 'Update Topology' : 'Create New Topology'}
			</Dialog.Title>
			<Dialog.Description>
				{#if !editingTopology}
					Upload a file to create a new topology.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		
		{#if editingTopology}
			<div class="mb-4 p-3 bg-muted rounded-md">
				<p class="text-sm font-medium">Currently updating:</p>
				<p class="text-sm text-muted-foreground">{editingTopology.Name}</p>
				<p class="text-xs text-muted-foreground">ID: {editingTopology.ID}</p>
			</div>
		{/if}

		<div class="space-y-4">
			<div>
				<label for="file-upload" class="block text-sm font-medium mb-2">
					Select file:
				</label>
				<input
					bind:this={fileInput}
					id="file-upload"
					type="file"
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
				{editingTopology ? 'Update' : 'Upload'}
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
				{#if deletingTopology}
					This action cannot be undone. This will permanently delete the topology 
					<strong>"{deletingTopology.Name}"</strong> and remove it from the system.
				{/if}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { deleteDialogOpen = false; deletingTopology = null; }}>
				Cancel
			</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDelete} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
