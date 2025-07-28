<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { cardVariants } from "./index.js";
	import type { HTMLAttributes } from "svelte/elements";

	type $$Props = HTMLAttributes<HTMLDivElement>;

	let className: $$Props["class"] = undefined;
	export { className as class };
</script>

<div class={cn(cardVariants(), className)} {...$$restProps}>
	<slot />
</div>
