<script lang="ts">
    import * as Table from "$lib/components/ui/table/index.js";
    interface Template {
		name: string;
		status: string;
		type: string;
		os: string;
	}

	const templates: Template[] = [
		{
			name: "debian-11-x64-server-template",
			status: "Not Built",
			type: "Server",
			os: "Debian"
		},
		{
			name: "debian-12-x64-server-template",
			status: "Built",
			type: "Server",
			os: "Debian"
		},
		{
			name: "kali-x64-desktop-template",
			status: "Built",
			type: "Desktop",
			os: "Kali Linux"
		},
		{
			name: "win11-22h2-x64-enterprise-template",
			status: "Built",
			type: "Unknown",
			os: "Windows 11"
		},
		{
			name: "win2022-server-x64-template",
			status: "Built",
			type: "Server",
			os: "Windows Server 2022"
		},
		{
			name: "ubuntu-24.04-x64-server-template",
			status: "Built",
			type: "Server",
			os: "Ubuntu"
		}
	];
</script>


<div class="flex-1 space-y-6 p-6">
    <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold">Templates</h1>
    <p class="text-sm text-muted-foreground">
        {templates.length} template{templates.length !== 1 ? 's' : ''} available
    </p>
    </div>
    
    <div class="border border-border rounded-lg overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full">
        <thead class="bg-gray-100 dark:bg-zinc-900">
            <tr class="border-b border-gray-200 dark:border-zinc-700">
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                Template Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                Type
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                OS
            </th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-zinc-600">
            {#each templates as template}
                <tr class="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600 hover:bg-gray-100 dark:hover:bg-zinc-700">
                    <th scope="row" class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {template.name}
                    </th>
                    <td class="px-6 py-4">
                        {#if template.status === "Built"}
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                Built
                            </span>
                        {:else}
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                Not Built
                            </span>
                        {/if}
                    </td>
                    <td class="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {template.type}
                    </td>
                    <td class="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {template.os}
                    </td>
                </tr>
            {/each}
        </tbody>
        </table>
    </div>
    </div>
</div>