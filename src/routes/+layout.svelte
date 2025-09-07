<script lang="ts">
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import AuthLogin from "$lib/components/AuthLogin.svelte";
	import { isAuthenticated } from "$lib/stores/auth";
	import { onMount } from "svelte";
	
	let { children } = $props();
	let showLogin = $state(true);

	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe(auth => {
			showLogin = !auth;
		});
		
		return unsubscribe;
	});
</script>

<ModeWatcher />

{#if showLogin}
	<AuthLogin />
{:else}
	<Sidebar.Provider>
		<AppSidebar />
		<main class="flex-1 w-full h-screen overflow-hidden">
			<Sidebar.Trigger />
			{@render children?.()}
		</main>
	</Sidebar.Provider>
{/if}