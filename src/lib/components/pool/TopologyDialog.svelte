<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { Map, Download, Check, ChevronsUpDown } from 'lucide-svelte';

    interface Props {
        open: boolean;
        topologyOptions: any[];
        currentTopologyData: any;
        isLoadingCurrentTopology: boolean;
        onSet: () => Promise<void>;
        onChange: (topologyId: string) => Promise<void>;
        onDownloadCurrent: () => Promise<void>;
        onClose: () => void;
    }

    let { open = $bindable(), topologyOptions, currentTopologyData, isLoadingCurrentTopology, onSet, onChange, onDownloadCurrent, onClose }: Props = $props();

    let topologyActionType: 'set' | 'change' = $state('set');
    let selectedTopologyId = $state('');
    let topologyComboboxOpen = $state(false);

    async function handleSet() {
        await onSet();
        open = false;
    }

    async function handleChange() {
        if (!selectedTopologyId) return;
        await onChange(selectedTopologyId);
        open = false;
        selectedTopologyId = '';
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Map class="h-5 w-5" />
                Manage Topology
            </Dialog.Title>
            <Dialog.Description>
                Set topology in Ludus or change topology inside pool definition.
            </Dialog.Description>
        </Dialog.Header>
        
        <div class="space-y-6">
            <!-- Action Type Selection -->
            <div class="space-y-3">
                <div class="text-sm font-medium">Action Type</div>
                <div class="grid grid-cols-2 gap-4">
                    <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {topologyActionType === 'set' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                        <input type="radio" bind:group={topologyActionType} value="set" class="text-primary" />
                        <span class="text-sm font-medium">Set</span>
                    </label>
                    <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer {topologyActionType === 'change' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}">
                        <input type="radio" bind:group={topologyActionType} value="change" class="text-primary" />
                        <span class="text-sm font-medium">Change</span>
                    </label>
                </div>
            </div>

            <!-- Content Area -->
            <div class="min-h-[5rem]">
                {#if topologyActionType === 'set'}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Current Topology</div>
                            <div class="w-full px-3 py-2 border border-input bg-muted/50 text-sm rounded-md flex items-center justify-between">
                                <span class="font-medium">
                                    {#if isLoadingCurrentTopology}
                                        <Skeleton class="h-4 w-32 inline-block" />
                                    {:else if currentTopologyData}
                                        {currentTopologyData.topologyName} (ID {currentTopologyData.topologyId})
                                    {:else}
                                        Loading...
                                    {/if}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onclick={onDownloadCurrent}
                                    class="h-6 px-2 text-xs"
                                    disabled={!currentTopologyData?.topologyFile || isLoadingCurrentTopology}
                                >
                                    <Download class="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <div class="text-sm font-medium">Select New Topology</div>
                            <Popover.Root bind:open={topologyComboboxOpen}>
                                <Popover.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            {...props}
                                            variant="outline"
                                            class="w-full justify-between"
                                            role="combobox"
                                            aria-expanded={topologyComboboxOpen}
                                        >
                                            {topologyOptions.find(t => t.value === selectedTopologyId)?.label || "Select topology..."}
                                            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    {/snippet}
                                </Popover.Trigger>
                                <Popover.Content class="w-full p-0">
                                    <Command.Root>
                                        <Command.Input placeholder="Search topologies..." />
                                        <Command.List>
                                            <Command.Empty>No topology found.</Command.Empty>
                                            <Command.Group>
                                                {#each topologyOptions as topology (topology.value)}
                                                    <Command.Item
                                                        value={topology.label}
                                                        onSelect={() => {
                                                            selectedTopologyId = topology.value;
                                                            topologyComboboxOpen = false;
                                                        }}
                                                    >
                                                        <Check class="mr-2 h-4 w-4 {selectedTopologyId !== topology.value && 'text-transparent'}" />
                                                        <div class="flex flex-col">
                                                            <span>{topology.label}</span>
                                                            <span class="text-xs text-muted-foreground">{topology.description}</span>
                                                        </div>
                                                    </Command.Item>
                                                {/each}
                                            </Command.Group>
                                        </Command.List>
                                    </Command.Root>
                                </Popover.Content>
                            </Popover.Root>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <Dialog.Footer class="flex justify-end gap-2">
            <Button variant="outline" onclick={onClose}>Cancel</Button>
            {#if topologyActionType === 'set'}
                <Button onclick={handleSet}>Set Topology</Button>
            {:else}
                <Button onclick={handleChange} disabled={!selectedTopologyId}>Change Topology</Button>
            {/if}
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
