<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { badgeVariants, type Props } from "./index.js";

	type $$Props = Props;

	let className: $$Props["class"] = undefined;
	export let variant: $$Props["variant"] = "default";
	export { className as class };
</script>

<div class={cn(badgeVariants({ variant }), className)} {...$$restProps}>
	<slot />
</div>
