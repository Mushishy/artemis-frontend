<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table';
	import type { Role } from './data.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const headers: { key: keyof Role; label: string; sortable?: boolean }[] = [
		{ key: 'name', label: 'Role Name', sortable: true },
		{ key: 'version', label: 'Role Version', sortable: true },
		{ key: 'type', label: 'Role Type', sortable: true },
		{ key: 'global', label: 'Global Role', sortable: true }
];
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
	<div class="mb-6 flex items-center justify-between flex-shrink-0">
		<div>
			<h1 class="text-3xl font-bold">Roles</h1>
			<p class="text-sm text-muted-foreground">
				{data.roles.length} role{data.roles.length !== 1 ? 's' : ''} available
			</p>
		</div>
	</div>

	<div class="flex-1 min-h-0 w-full overflow-hidden pb-4">
		<DataTable data={data.roles} {headers} maxHeight="calc(100% - 2rem)" />
	</div>
</div>