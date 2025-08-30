<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { X, Download, Pause, Play } from 'lucide-svelte';

	interface Props {
		open: boolean;
		userId?: string | null;
		onClose: () => void;
	}

	let { open = $bindable(false), userId, onClose }: Props = $props();
	
	let logs = $state<string[]>([]);
	let isStreaming = $state(true);
	let cursor = $state<string | null>(null);
	let logContainer: HTMLElement;

	// Mock function - replace with your actual API call
	async function fetchLogs(userId: string, cursor?: string | null) {
		// Replace this with your actual endpoint
		// const response = await fetch(`/api/users/${userId}/logs?cursor=${cursor || ''}`);
		// const data = await response.json();
		
		// Mock data for demonstration
		await new Promise(resolve => setTimeout(resolve, 500));
		const mockLogs = [
			`[${new Date().toISOString()}] User ${userId} logged in`,
			`[${new Date().toISOString()}] Session started for user ${userId}`,
			`[${new Date().toISOString()}] Action performed: view dashboard`,
		];
		
		return {
			logs: mockLogs,
			nextCursor: Date.now().toString(),
			hasMore: true
		};
	}

	let fetchInterval: NodeJS.Timeout | null = null;

	async function loadInitialLogs() {
		if (!userId) return;
		
		try {
			const result = await fetchLogs(userId);
			logs = result.logs;
			cursor = result.nextCursor;
			
			// Auto-scroll to bottom
			setTimeout(() => {
				if (logContainer) {
					logContainer.scrollTop = logContainer.scrollHeight;
				}
			}, 100);
		} catch (error) {
			console.error('Failed to load logs:', error);
			logs = [`Error loading logs for user ${userId}`];
		}
	}

	async function loadMoreLogs() {
		if (!userId || !cursor) return;
		
		try {
			const result = await fetchLogs(userId, cursor);
			logs = [...logs, ...result.logs];
			cursor = result.nextCursor;
			
			// Auto-scroll to bottom
			setTimeout(() => {
				if (logContainer) {
					logContainer.scrollTop = logContainer.scrollHeight;
				}
			}, 100);
		} catch (error) {
			console.error('Failed to load more logs:', error);
		}
	}

	function startStreaming() {
		if (fetchInterval) clearInterval(fetchInterval);
		
		fetchInterval = setInterval(() => {
			if (isStreaming) {
				loadMoreLogs();
			}
		}, 2000); // Fetch every 2 seconds
	}

	function stopStreaming() {
		if (fetchInterval) {
			clearInterval(fetchInterval);
			fetchInterval = null;
		}
	}

	function toggleStreaming() {
		isStreaming = !isStreaming;
		if (isStreaming) {
			startStreaming();
		} else {
			stopStreaming();
		}
	}

	function downloadLogs() {
		const logText = logs.join('\n');
		const blob = new Blob([logText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `user-${userId}-logs.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	$effect(() => {
		if (open && userId) {
			loadInitialLogs();
			startStreaming();
		} else {
			stopStreaming();
			logs = [];
			cursor = null;
		}
		
		return () => {
			stopStreaming();
		};
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="!max-w-none !w-[100vw] h-[95vh] m-0 p-0 flex flex-col rounded-none">
		<div class="flex flex-col h-full">
			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-3 border-b bg-gray-100 dark:bg-zinc-900 flex-shrink-0">
				<Dialog.Title class="text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
					{userId} Logs
				</Dialog.Title>
				
				<div class="flex items-center gap-2">
					<Button 
						variant="outline" 
						size="sm" 
						onclick={toggleStreaming}
						class="gap-1.5 h-8 text-xs"
					>
						{#if isStreaming}
							<Pause class="h-3 w-3" />
							Pause
						{:else}
							<Play class="h-3 w-3" />
							Resume
						{/if}
					</Button>
					
					<Button 
						variant="outline" 
						size="sm" 
						onclick={downloadLogs}
						class="gap-1.5 h-8 text-xs"
					>
						<Download class="h-3 w-3" />
						Download
					</Button>
				</div>
			</div>
			
			<!-- Log Content -->
			<div class="flex-1 bg-gray-900 dark:bg-black text-green-600 dark:text-green-400 font-mono text-sm overflow-hidden">
				<div 
					bind:this={logContainer}
					class="h-full w-full overflow-y-auto overflow-x-auto p-4 whitespace-pre"
					style="scrollbar-width: thin; scrollbar-color: rgb(34 197 94) rgb(31 41 55); --scrollbar-color-dark: #4ade80 #1a1a1a;"
				>
					{#if logs.length === 0}
						<div class="text-gray-500 dark:text-gray-400">Loading logs...</div>
					{:else}
						{#each logs as log, index}
							<div class="leading-relaxed hover:bg-gray-800/30 dark:hover:bg-gray-900/50 px-2 py-1 rounded mb-1">
								{log}
							</div>
						{/each}
					{/if}
					
					{#if isStreaming}
						<div class="text-gray-500 dark:text-gray-400 animate-pulse mt-2">
							● Streaming...
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
