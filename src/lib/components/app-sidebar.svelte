<script lang="ts">
	import LayersIcon from "@lucide/svelte/icons/layers";
	import HouseIcon from "@lucide/svelte/icons/house";
	import MapIcon from "@lucide/svelte/icons/map";
	import SwordsIcon from "@lucide/svelte/icons/swords";
	import BookIcon from "@lucide/svelte/icons/book-user";
	import GamepadIcon from "@lucide/svelte/icons/gamepad-2";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import SunIcon from "@lucide/svelte/icons/sun";
    import MoonIcon from "@lucide/svelte/icons/moon";
	import UsersIcon from "@lucide/svelte/icons/users";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import ServerIcon from "@lucide/svelte/icons/server";

    import { toggleMode } from "mode-watcher";
    import { Button } from "$lib/components/ui/button/index.js";

	// Menu items.
    const menus = [ 
        {
			name: "Home",
			url: "/",
			icon: HouseIcon,
		},
    ]

	const items = [
		{
			name: "Topologies",
			url: "/topologies",
			icon: MapIcon,
		},
		{
			name: "Scenarios",
			url: "/scenarios",
			icon: LayersIcon,
		},
		{
			name: "Users",
			url: "/users",
			icon: UsersIcon,
		},
		{
			name: "Roles",
			url: "/roles",
			icon: BookIcon,
		},
		{
			name: "Templates",
			url: "/templates",
			icon: FileTextIcon,
		},
	];

	const games = [
		{
			name: "Create Range",
			url: "/range",
			icon: SwordsIcon,
		},
		{
			name: "Active Games",
			url: "/games",
			icon: GamepadIcon,
		},
		{
			name: "Live CTFd",
			url: "/ctfd",
			icon: CalendarIcon,
		}
	];
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<div class="flex items-center gap-2 p-4">
			<div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
				<a href= "/"><img src="/favicon.svg" alt=""></a>
			</div>
			<div class="grid flex-1 text-left text-sm leading-tight">
				<a href= "/" class="truncate font-semibold">Ludus</a>
			</div>
		</div>
	</Sidebar.Header>
	
	<Sidebar.Content>

        <Sidebar.Group>
			<Sidebar.GroupLabel>Menu</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each menus as menu (menu.name)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={menu.url} {...props}>
										<menu.icon />
										<span>{menu.name}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

        <Sidebar.Group>
			<Sidebar.GroupLabel>Games</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each games as game (game.name)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={game.url} {...props}>
										<game.icon />
										<span>{game.name}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

        <Sidebar.Group>
			<Sidebar.GroupLabel>Collections</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.name)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon />
										<span>{item.name}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		
	</Sidebar.Content>
	
	<Sidebar.Footer>
		<div class="flex items-center justify-between p-2">
			<span class="text-xs text-muted-foreground">Version: 0.1.0</span>
			<Button onclick={toggleMode} variant="ghost" size="icon" class="h-6 w-6">
				<SunIcon
					class="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<MoonIcon
					class="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>
	</Sidebar.Footer>
	
	<Sidebar.Rail />
</Sidebar.Root>