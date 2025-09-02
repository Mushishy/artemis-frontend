<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, Edit, Trash2, Download, FlagTriangleRight, KeyRound, GlobeLock, FileText, Search } from 'lucide-svelte';

	interface Props {
		data: any[];
		headers?: { key: string; label: string; sortable?: boolean }[];
		itemsPerPage?: number;
		currentPage?: number;
		maxHeight?: string;
		showActions?: boolean;
		onRowClick?: (item: any) => void;
		onEdit?: (item: any) => void;
		onDelete?: (item: any) => void;
		onDownload?: (item: any) => void;
		onDownloadCtfdData?: (item: any) => void;
		onDownloadLogins?: (item: any) => void;
		onDownloadWireguard?: (item: any) => void;
		onNote?: (item: any) => void;
		onInspect?: (item: any) => void;
		showDeleteFor?: (item: any) => boolean;
	}

	let { data, headers = [], itemsPerPage = 13, currentPage = 1, maxHeight = '400px', showActions = false, onRowClick, onEdit, onDelete, onDownload, onDownloadCtfdData, onDownloadLogins, onDownloadWireguard, onNote, onInspect, showDeleteFor }: Props = $props();

	let sortColumn: string | null = $state(null);
	let sortDirection: 'asc' | 'desc' = $state('asc');
	let currentItemsPerPage = $state(itemsPerPage);

	const itemsPerPageOptions = [13, 18, 27, 63];

	// Use getter functions instead of $derived for better Svelte 5 compatibility
	function getSortedData(): any[] {
		if (!sortColumn || !data || !Array.isArray(data)) {
			return data || [];
		}
		
		return [...data].sort((a, b) => {
			const aVal = a[sortColumn as string];
			const bVal = b[sortColumn as string];
			
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

	function getPaginatedData(): any[] {
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

	function handleSort(column: string, sortable: boolean = true) {
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
			if (value === 'role' || value == 'regular') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			}
			// Collection type tags (yellow)
			else if (value === 'collection' || value == 'main') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			}
			// Status tags - Red (error/failed states)
			else if (value === 'UNKNOWN' || value === 'NEVER DEPLOYED' || value === 'ERROR' || value === 'DESTROYED' || value === 'ABORTED') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			}
			// Status tags - Green (success states)
			else if (value === 'DEPLOYED') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			}
			// Status tags - Blue (in-progress states)
			else if (value === 'DEPLOYING' || value === 'DESTROYING') {
				return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			}
		}
		return '';
	}

	// Calculate column widths based on number of columns and whether actions are shown
	function getColumnWidth(index: number, totalHeaders: number, showActions: boolean): string {
		// Keep consistent widths regardless of actions - just reserve space for actions column
		if (index === 0) {
			// First column (Name) always gets the most space
			return totalHeaders === 2 ? 'w-1/2' : totalHeaders === 3 ? 'w-2/5' : 'w-1/3';
		} else {
			// Other columns share remaining space equally
			return totalHeaders === 2 ? 'w-1/4' : totalHeaders === 3 ? 'w-1/5' : 'w-1/6';
		}
	}

	function shouldHighlight(value: any): boolean {
		return typeof value === 'boolean' || 
			   value === 'Built' || value === 'Not Built' ||
			   value === 'True' || value === 'False' ||
			   value === 'role' || value === 'collection' ||
			   value === 'regular' || value === 'main' ||
			   value === 'UNKNOWN' || value === 'NEVER DEPLOYED' || value === 'ERROR' || value === 'DESTROYED' || value === 'ABORTED' ||
			   value === 'DEPLOYED' ||
			   value === 'DEPLOYING' || value === 'DESTROYING';
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
							class="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider {getColumnWidth(index, headers.length, showActions)} {header.sortable !== false ? 'cursor-pointer hover:bg-gray-300 dark:hover:bg-zinc-700 select-none' : ''}"
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
						<th class="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider w-1/4">
							Actions
						</th>
					{/if}
				</tr>
			</thead>
			<tbody class="bg-white dark:bg-zinc-800">
				{#each getPaginatedData() as row, index}
					<tr
						class="border-b border-gray-200 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700 {onRowClick ? 'cursor-pointer' : ''}"
						style="height: 3.25rem; max-height: 3.25rem;"
						onclick={() => onRowClick?.(row)}
					>
						{#each headers as header, headerIndex}
							{@const value = row[header.key]}
							{#if headerIndex === 0}
								<th scope="row" class="px-6 py-4 font-medium text-gray-900 dark:text-white text-left">
									{renderValue(value)}
								</th>
							{:else}
								<td class="px-6 py-4 text-center">
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
							<td class="px-6 py-4 text-center" style="height: 3.25rem; max-height: 3.25rem;">
								<div class="flex items-center justify-center gap-1 h-full">
									{#if onInspect}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onInspect?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:hover:bg-gray-950 dark:hover:border-gray-700 dark:hover:text-gray-300"
											title="Inspect"
										>
											<Search class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onDownload}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onDownload?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-700 dark:hover:text-blue-300"
											title="Download"
										>
											<Download class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onDownloadCtfdData}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onDownloadCtfdData?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-purple-950 dark:hover:border-purple-700 dark:hover:text-purple-300"
											title="Download CTFd Data"
										>
											<FlagTriangleRight class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onDownloadLogins}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onDownloadLogins?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-orange-950 dark:hover:border-orange-700 dark:hover:text-orange-300"
											title="Download Innitial CTFd Logins"
										>
											<KeyRound class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onDownloadWireguard}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onDownloadWireguard?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700 dark:hover:bg-cyan-950 dark:hover:border-cyan-700 dark:hover:text-cyan-300"
											title="Download Wireguard Access"
										>
											<GlobeLock class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onNote}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onNote?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 dark:hover:bg-amber-950 dark:hover:border-amber-700 dark:hover:text-amber-300"
											title="Edit Note"
										>
											<FileText class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onEdit}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onEdit?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-green-50 hover:border-green-300 hover:text-green-700 dark:hover:bg-green-950 dark:hover:border-green-700 dark:hover:text-green-300"
											title="Edit"
										>
											<Edit class="h-3.5 w-3.5" />
										</Button>
									{/if}
									{#if onDelete && (!showDeleteFor || showDeleteFor(row))}
										<Button
											variant="outline"
											size="sm"
											onclick={(e) => { e.stopPropagation(); onDelete?.(row); }}
											class="p-1.5 h-7 w-7 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-300"
											title="Delete"
										>
											<Trash2 class="h-3.5 w-3.5" />
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
