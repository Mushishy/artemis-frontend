<script lang="ts" generics="T">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, Edit, Trash2, Download } from 'lucide-svelte';

	interface Props {
		data: T[];
		headers: { key: keyof T; label: string; sortable?: boolean }[];
		itemsPerPage?: number;
		currentPage?: number;
		maxHeight?: string;
		showActions?: boolean;
		onEdit?: (item: T) => void;
		onDelete?: (item: T) => void;
		onDownload?: (item: T) => void;
	}

	let { data, headers, itemsPerPage = 13, currentPage = 1, maxHeight = '400px', showActions = false, onEdit, onDelete, onDownload }: Props = $props();

	let sortColumn: keyof T | null = $state(null);
	let sortDirection: 'asc' | 'desc' = $state('asc');
	let currentItemsPerPage = $state(itemsPerPage);

	const itemsPerPageOptions = [13, 16, 32, 64];

	// Use getter functions instead of $derived for better Svelte 5 compatibility
	function getSortedData(): T[] {
		if (!sortColumn || !data || !Array.isArray(data)) {
			return data || [];
		}
		
		return [...data].sort((a, b) => {
			const aVal = a[sortColumn as keyof T];
			const bVal = b[sortColumn as keyof T];
			
			// Handle different data types
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				const comparison = aVal.localeCompare(bVal);
				return sortDirection === 'asc' ? comparison : -comparison;
			}
			
			if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
				const comparison = aVal === bVal ? 0 : aVal ? 1 : -1;
				return sortDirection === 'asc' ? comparison : -comparison;
			}
			
			// Default comparison
			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	}

	function getTotalPages(): number {
		const sortedData = getSortedData();
		return Math.ceil(sortedData.length / currentItemsPerPage);
	}

	function getPaginatedData(): T[] {
		const sortedData = getSortedData();
		const startIndex = (currentPage - 1) * currentItemsPerPage;
		const endIndex = startIndex + currentItemsPerPage;
		return sortedData.slice(startIndex, endIndex);
	}

	function nextPage() {
		const totalPages = getTotalPages();
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function goToFirstPage() {
		currentPage = 1;
	}

	function goToLastPage() {
		currentPage = getTotalPages();
	}

	function handleItemsPerPageChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		currentItemsPerPage = parseInt(target.value);
		currentPage = 1; // Reset to first page when changing items per page
	}

	function handleSort(column: keyof T, sortable: boolean = true) {
		if (!sortable) return;
		
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		// Reset to first page when sorting
		currentPage = 1;
	}

	function renderValue(value: any): string {
		return getDisplayValue(value);
	}

	function getBooleanClass(value: any): string {
		if (typeof value === 'boolean') {
			return value
				? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
				: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
		}
		return '';
	}

	function getTagClass(value: any): string {
		if (typeof value === 'string') {
			// Role type tags (blue)
			if (value === 'role') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			}
			// Collection type tags (yellow)
			else if (value === 'collection') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			}
		}
		return '';
	}

	function shouldHighlight(value: any): boolean {
		return typeof value === 'boolean' || 
			   value === 'Built' || value === 'Not Built' ||
			   value === 'True' || value === 'False' ||
			   value === 'role' || value === 'collection';
	}

	function getDisplayValue(value: any): string {
		if (typeof value === 'boolean') {
			return value ? 'True' : 'False';
		}
		return String(value);
	}
</script>

<div class="border border-border rounded-lg overflow-hidden w-full h-full flex flex-col">
	<div class="flex-1 overflow-auto bg-white dark:bg-zinc-800" style="max-height: {maxHeight};">
		<table class="w-full table-fixed border-collapse">
			<thead class="bg-gray-100 dark:bg-zinc-900 sticky top-0 z-10">
				<tr class="border-b border-gray-200 dark:border-zinc-700">
					{#each headers as header, index}
						<th
							class="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider {index === 0 ? 'w-2/5' : showActions && index === headers.length - 1 ? 'w-1/5' : 'w-1/5'} {header.sortable !== false ? 'cursor-pointer hover:bg-gray-300 dark:hover:bg-zinc-700 select-none' : ''}"
							onclick={() => handleSort(header.key, header.sortable !== false)}
						>
							<div class="flex items-center justify-center gap-1">
								{header.label}
								{#if header.sortable !== false}
									<div class="flex flex-col">
										<ChevronUp 
											class="h-3 w-3 {sortColumn === header.key && sortDirection === 'asc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}" 
										/>
										<ChevronDown 
											class="h-3 w-3 -mt-1 {sortColumn === header.key && sortDirection === 'desc' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}" 
										/>
									</div>
								{/if}
							</div>
						</th>
					{/each}
					{#if showActions}
						<th class="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider w-1/5">
							Actions
						</th>
					{/if}
				</tr>
			</thead>
			<tbody class="bg-white dark:bg-zinc-800">
				{#each getPaginatedData() as row, index}
					<tr
						class="border-b border-gray-200 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700"
						style="height: 3.25rem;"
					>
						{#each headers as header, headerIndex}
							{@const value = row[header.key]}
							{#if headerIndex === 0}
								<th scope="row" class="px-6 py-4 font-medium text-gray-900 dark:text-white text-left">
									{renderValue(value)}
								</th>
							{:else}
								<td class="px-6 py-4 {shouldHighlight(value) ? 'text-center' : 'text-left'}">
									{#if shouldHighlight(value)}
										<span class={getTagClass(value) || getBooleanClass(value)}>
											{renderValue(value)}
										</span>
									{:else}
										<span class="text-gray-700 dark:text-gray-300">
											{renderValue(value)}
										</span>
									{/if}
								</td>
							{/if}
						{/each}
						{#if showActions}
							<td class="px-6 py-4 text-center">
								<div class="flex items-center justify-center gap-2">
									{#if onDownload}
										<Button
											variant="outline"
											size="sm"
											onclick={() => onDownload?.(row)}
											class="p-2 h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-700 dark:hover:text-blue-300"
										>
											<Download class="h-4 w-4" />
										</Button>
									{/if}
									{#if onEdit}
										<Button
											variant="outline"
											size="sm"
											onclick={() => onEdit?.(row)}
											class="p-2 h-8 w-8"
										>
											<Edit class="h-4 w-4" />
										</Button>
									{/if}
									{#if onDelete}
										<Button
											variant="outline"
											size="sm"
											onclick={() => onDelete?.(row)}
											class="p-2 h-8 w-8 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-300"
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									{/if}
								</div>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 h-16 flex-shrink-0">
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
				<span>Items per page:</span>
				<select 
					class="px-2 py-1 border border-gray-300 dark:border-zinc-600 rounded text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
					value={currentItemsPerPage}
					onchange={handleItemsPerPageChange}
				>
					{#each itemsPerPageOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
			<div class="text-sm text-gray-700 dark:text-gray-300">
				{(currentPage - 1) * currentItemsPerPage + 1}-{Math.min(
					currentPage * currentItemsPerPage,
					getSortedData().length
				)} of {getSortedData().length}
			</div>
		</div>

		{#if getTotalPages() > 1}
			<div class="flex items-center space-x-1">
				<Button
					variant="outline"
					size="sm"
					onclick={goToFirstPage}
					disabled={currentPage === 1}
					class="flex items-center px-2"
				>
					<ChevronsLeft class="h-4 w-4" />
				</Button>
				
				<Button
					variant="outline"
					size="sm"
					onclick={prevPage}
					disabled={currentPage === 1}
					class="flex items-center px-2"
				>
					<ChevronLeft class="h-4 w-4" />
				</Button>

				<Button
					variant="outline"
					size="sm"
					onclick={nextPage}
					disabled={currentPage === getTotalPages()}
					class="flex items-center px-2"
				>
					<ChevronRight class="h-4 w-4" />
				</Button>
				
				<Button
					variant="outline"
					size="sm"
					onclick={goToLastPage}
					disabled={currentPage === getTotalPages()}
					class="flex items-center px-2"
				>
					<ChevronsRight class="h-4 w-4" />
				</Button>
			</div>
		{/if}
	</div>
</div>
