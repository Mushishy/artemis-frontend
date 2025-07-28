<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	import { X } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
	}

	let { open = false, onOpenChange }: Props = $props();

	const {
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open: isOpen }
	} = createDialog({
		forceVisible: true,
		open: open,
		onOpenChange: ({ next }) => {
			onOpenChange?.(next);
			return next;
		}
	});
</script>

{#if $isOpen}
	<div use:melt={$portalled}>
		<div
			use:melt={$overlay}
			class="fixed inset-0 z-50 bg-black/80"
			transition:fade={{ duration: 150 }}
		/>
		<div
			class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 sm:rounded-lg dark:bg-zinc-950"
			transition:fade={{ duration: 150 }}
			use:melt={$content}
		>
			<slot />
			<button
				use:melt={$close}
				class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-zinc-950 dark:focus:ring-zinc-300"
			>
				<X class="h-4 w-4" />
				<span class="sr-only">Close</span>
			</button>
		</div>
	</div>
{/if}
