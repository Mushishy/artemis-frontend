<script lang="ts">
	import { GamepadIcon, UsersIcon, FileTextIcon, LayersIcon, CpuIcon, HardDriveIcon, ClockIcon, MemoryStickIcon, MapIcon, SwordsIcon, BookIcon }  from 'lucide-svelte';
	import type { PageData } from './$types';
	import { createPieArc } from '$lib/utils/helper';

	export let data: PageData;
	$: ({ proxmoxStats } = data);
</script>

<div class="min-h-[100vh] flex-1 rounded-xl md:min-h-min">
	<div class="p-6">
		<h1 class="text-3xl font-bold">Welcome to Ludus</h1>
		<p class="text-sm text-muted-foreground">
			Open-source cyber-range, proven in practice, with the purpose of boosting the resilience of digital society.
		</p>
		
		{#if proxmoxStats}
			<div class="mt-6 space-y-4">
				<h2 class="text-xl font-semibold">System Statistics</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<!-- Users -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<UsersIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.users}</h3>
								<p class="text-base text-muted-foreground">Users</p>
							</div>
						</div>
					</div>

					<!-- Topologies -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<MapIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.numberOfTopologies}</h3>
								<p class="text-base text-muted-foreground">Topologies</p>
							</div>
						</div>
					</div>

					<!-- Scenarios -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<LayersIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.numberOfScenarios}</h3>
								<p class="text-base text-muted-foreground">Scenarios</p>
							</div>
						</div>
					</div>

					<!-- Roles -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<BookIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.numberOfRoles}</h3>
								<p class="text-base text-muted-foreground">Roles</p>
							</div>
						</div>
					</div>

					<!-- Templates -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<FileTextIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.templates}</h3>
								<p class="text-base text-muted-foreground">Templates</p>
							</div>
						</div>
					</div>

					<!-- Pools -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<GamepadIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.numberOfPools}</h3>
								<p class="text-base text-muted-foreground">Pools</p>
							</div>
						</div>
					</div>

					<!-- VMs -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<SwordsIcon class="h-8 w-8" />
							<div>
								<h3 class="text-2xl font-bold">{proxmoxStats.vms}</h3>
								<p class="text-base text-muted-foreground">Virtual Machines</p>
							</div>
						</div>
					</div>
					
					<!-- Uptime -->
					<div class="rounded-lg border p-6">
						<div class="flex items-center gap-4">
							<ClockIcon class="h-8 w-8" />
							<div>
								<h3 class="text-xl font-bold">{proxmoxStats.uptimeFormatted}</h3>
								<p class="text-base text-muted-foreground">Uptime</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Resource Usage Charts -->
			<div class="mt-8 space-y-4">
				<h2 class="text-xl font-semibold">Resource Usage</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<!-- CPU Usage -->
					<div class="rounded-lg border p-6 text-center">
						<div class="relative mx-auto mb-4 w-32 h-32 flex items-center justify-center">
							<svg width="100%" height="100%" viewBox="0 0 100 100" class="transform -rotate-90">
								<!-- Background circle -->
								<circle cx="50" cy="50" r="35" fill="none" stroke="rgb(229 231 235)" stroke-width="8"/>
								<!-- Progress arc -->
								<path d={createPieArc(proxmoxStats.cpuUsagePercentage, 35)} fill="none" stroke="rgb(249 115 22)" stroke-width="8" stroke-linecap="round"/>
								<!-- Center colored background -->
								<circle cx="50" cy="50" r="20" fill="rgb(249 115 22)" opacity="0.1"/>
							</svg>
							<!-- Percentage overlay -->
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-lg font-bold text-orange-600">{proxmoxStats.cpuUsagePercentage.toFixed(1)}%</span>
							</div>
						</div>
						<div class="flex items-center justify-center gap-2 mb-1">
							<CpuIcon class="h-5 w-5 text-orange-500" />
							<h3 class="text-xl font-semibold">CPU Usage</h3>
						</div>
						<p class="text-sm text-muted-foreground">{proxmoxStats.cpuUsagePercentage.toFixed(2)}% of {proxmoxStats.maxCpu} cores</p>
					</div>

					<!-- Memory Usage -->
					<div class="rounded-lg border p-6 text-center">
						<div class="relative mx-auto mb-4 w-32 h-32 flex items-center justify-center">
							<svg width="100%" height="100%" viewBox="0 0 100 100" class="transform -rotate-90">
								<!-- Background circle -->
								<circle cx="50" cy="50" r="35" fill="none" stroke="rgb(229 231 235)" stroke-width="8"/>
								<!-- Progress arc -->
								<path d={createPieArc((proxmoxStats.memoryUsedGiB / proxmoxStats.memoryTotalGiB) * 100, 35)} fill="none" stroke="rgb(14 165 233)" stroke-width="8" stroke-linecap="round"/>
								<!-- Center colored background -->
								<circle cx="50" cy="50" r="20" fill="rgb(14 165 233)" opacity="0.1"/>
							</svg>
							<!-- Percentage overlay -->
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-lg font-bold text-blue-600">{((proxmoxStats.memoryUsedGiB / proxmoxStats.memoryTotalGiB) * 100).toFixed(1)}%</span>
							</div>
						</div>
						<div class="flex items-center justify-center gap-2 mb-1">
							<MemoryStickIcon class="h-5 w-5 text-blue-500" />
							<h3 class="text-xl font-semibold">RAM</h3>
						</div>
						<p class="text-sm text-muted-foreground">Used {proxmoxStats.memoryUsedGiB.toFixed(1)}GB of {proxmoxStats.memoryTotalGiB.toFixed(1)}GB</p>
					</div>

					<!-- Disk Usage -->
					<div class="rounded-lg border p-6 text-center">
						<div class="relative mx-auto mb-4 w-32 h-32 flex items-center justify-center">
							<svg width="100%" height="100%" viewBox="0 0 100 100" class="transform -rotate-90">
								<!-- Background circle -->
								<circle cx="50" cy="50" r="35" fill="none" stroke="rgb(229 231 235)" stroke-width="8"/>
								<!-- Progress arc -->
								<path d={createPieArc((proxmoxStats.diskUsedGiB / proxmoxStats.diskTotalGiB) * 100, 35)} fill="none" stroke="rgb(234 179 8)" stroke-width="8" stroke-linecap="round"/>
								<!-- Center colored background -->
								<circle cx="50" cy="50" r="20" fill="rgb(234 179 8)" opacity="0.1"/>
							</svg>
							<!-- Percentage overlay -->
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-lg font-bold text-yellow-600">{((proxmoxStats.diskUsedGiB / proxmoxStats.diskTotalGiB) * 100).toFixed(1)}%</span>
							</div>
						</div>
						<div class="flex items-center justify-center gap-2 mb-1">
							<HardDriveIcon class="h-5 w-5 text-yellow-500" />
							<h3 class="text-xl font-semibold">Disk Storage</h3>
						</div>
						<p class="text-sm text-muted-foreground">Used {proxmoxStats.diskUsedGiB.toFixed(1)}GB of {proxmoxStats.diskTotalGiB.toFixed(0)}GB</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="mt-6">
				<p class="text-muted-foreground">Loading system statistics...</p>
			</div>
		{/if}
	</div>
</div>
