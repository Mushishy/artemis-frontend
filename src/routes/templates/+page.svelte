<script lang="ts">
	import { DataTable } from '$lib/components/ui/data-table';
	import type { TemplateDisplay } from '$lib/api/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const headers: { key: keyof TemplateDisplay; label: string; sortable?: boolean }[] = [
		{ key: 'name', label: 'Template Name', sortable: true },
		{ key: 'status', label: 'Built', sortable: true }
	];
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
	<div class="mb-6 flex items-center justify-between flex-shrink-0">
		<div>
			<h1 class="text-3xl font-bold">Templates</h1>
			<p class="text-sm text-muted-foreground">
				{data.templates.length} template{data.templates.length !== 1 ? 's' : ''} available
			</p>
		</div>
	</div>

	<div class="flex-1 min-h-0 w-full overflow-hidden pb-4">
		<DataTable data={data.templates} {headers} maxHeight="calc(100% - 2rem)" />
	</div>
</div>