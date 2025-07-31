<script lang="ts">
    import { Check, ChevronsUpDown } from 'lucide-svelte';
    import { tick } from 'svelte';
    import * as Command from '$lib/components/ui/command';
    import * as Popover from '$lib/components/ui/popover';
    import { Button } from '$lib/components/ui/button';
    import { cn } from '$lib/utils';

    interface ComboboxOption {
        value: string;
        label: string;
        description?: string;
    }

    interface ComboboxProps {
        options: ComboboxOption[];
        placeholder?: string;
        searchPlaceholder?: string;
        value?: string;
        selectedLabel?: string;
        disabled?: boolean;
        class?: string;
        onchange?: (detail: { value: string; option: ComboboxOption }) => void;
    }

    let {
        options = [],
        placeholder = "Select an option...",
        searchPlaceholder = "Search...",
        value = $bindable(),
        selectedLabel = $bindable(),
        disabled = false,
        class: className = "",
        onchange,
        ...restProps
    }: ComboboxProps = $props();

    let open = $state(false);

    const selectedValue = $derived(() => {
        const option = options.find((f) => f.value === value);
        if (option) {
            selectedLabel = option.label;
            return option.label;
        }
        return "";
    });

    function closeAndFocusTrigger() {
        open = false;
    }

    function handleSelect(selectedOption: ComboboxOption) {
        value = selectedOption.value;
        selectedLabel = selectedOption.label;
        onchange?.({ value: selectedOption.value, option: selectedOption });
        closeAndFocusTrigger();
    }
</script>

<div class={cn("w-full", className)} {...restProps}>
    <Popover.Root bind:open>
        <Popover.Trigger>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                class="w-full justify-between"
                {disabled}
            >
                {selectedValue || placeholder}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </Popover.Trigger>
        <Popover.Content class="w-full p-0">
            <Command.Root>
                <Command.Input placeholder={searchPlaceholder} />
                <Command.List>
                    <Command.Empty>No results found.</Command.Empty>
                    <Command.Group>
                        {#each options as option}
                            <Command.Item
                                value={option.value}
                                onSelect={() => handleSelect(option)}
                            >
                                <Check
                                    class={cn(
                                        "mr-2 h-4 w-4",
                                        value !== option.value && "text-transparent"
                                    )}
                                />
                                <div class="flex flex-col">
                                    <span>{option.label}</span>
                                    {#if option.description}
                                        <span class="text-xs text-muted-foreground">{option.description}</span>
                                    {/if}
                                </div>
                            </Command.Item>
                        {/each}
                    </Command.Group>
                </Command.List>
            </Command.Root>
        </Popover.Content>
    </Popover.Root>
</div>
