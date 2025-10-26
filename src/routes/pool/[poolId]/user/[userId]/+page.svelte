<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { formatDate } from '$lib/utils';
    import type { PageData } from './$types';
    import type { UserRangeVM } from '$lib/api/types';
    import { ArrowLeft } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';

    export let data: PageData;

    // Network visualization state
    let svgElement: SVGSVGElement;
    let isDragging = false;
    let dragTarget: SVGElement | null = null;
    let dragOffset = { x: 0, y: 0 };
    
    // Network data processing
    interface NetworkNode {
        id: string;
        label: string;
        type: 'router' | 'vlan' | 'vm';
        x: number;
        y: number;
        vlan?: number;
        visible: boolean;
        vm?: UserRangeVM;
    }

    interface NetworkLink {
        source: string;
        target: string;
        visible: boolean;
    }

    let nodes: NetworkNode[] = [];
    let links: NetworkLink[] = [];
    let collapsedVlans = new Set<number>();

    // Process VM data into network structure
    function processNetworkData() {
        if (!data.userRange?.VMs) {
            return;
        }

        // Clear existing data to prevent duplicates
        nodes = [];
        links = [];
        
        const vlans = new Map<number, UserRangeVM[]>();
        let router: UserRangeVM | undefined;
        const processedVmIds = new Set<string>(); // Track processed VM IDs to prevent duplicates

        // Create a map to deduplicate VMs by name (keep the first occurrence)
        const uniqueVMs = new Map<string, UserRangeVM>();
        data.userRange.VMs.forEach((vm: UserRangeVM) => {
            if (!uniqueVMs.has(vm.name)) {
                uniqueVMs.set(vm.name, vm);
            }
        });

        // Categorize unique VMs
        uniqueVMs.forEach((vm: UserRangeVM) => {
            processedVmIds.add(vm.ID.toString());
            
            if (vm.name.toLowerCase().includes('router')) {
                router = vm;
            } else {
                const vlan = parseInt(vm.ip.split('.')[2]);
                if (!vlans.has(vlan)) {
                    vlans.set(vlan, []);
                }
                vlans.get(vlan)!.push(vm);
            }
        });

        // Add router node (always at the top)
        if (router) {
            nodes.push({
                id: 'router',
                label: `Router`,
                type: 'router',
                x: 50, // Center X
                y: 15, // Top position
                visible: true,
                vm: router
            });
        }

        // Add VLAN nodes (arranged horizontally in the middle)
        const vlanArray = Array.from(vlans.keys()).sort();
        vlanArray.forEach((vlanNumber, vlanIndex) => {
            const vms = vlans.get(vlanNumber)!;
            const vlanId = `vlan-${vlanNumber}`;
            const vlanSpacing = 80 / Math.max(1, vlanArray.length - 1); // Space VLANs evenly
            const vlanX = vlanArray.length === 1 ? 50 : 10 + (vlanIndex * vlanSpacing);
            
            nodes.push({
                id: vlanId,
                label: `Vlan ${vlanNumber}`,
                type: 'vlan',
                x: vlanX,
                y: 35, // Middle position
                vlan: vlanNumber,
                visible: true
            });

            // Link VLAN to router
            if (router) {
                links.push({
                    source: 'router',
                    target: vlanId,
                    visible: true
                });
            }

            // Add VM nodes for this VLAN (arranged horizontally next to each other)
            vms.forEach((vm: UserRangeVM, vmIndex: number) => {
                const vmId = `vm-${vm.ID}`;
                
                // Double-check for duplicate nodes (shouldn't happen with the earlier check, but just in case)
                if (nodes.find(n => n.id === vmId)) {
                    console.warn(`Attempted to create duplicate node: ${vmId} (${vm.name})`);
                    return;
                }
                
                // Calculate horizontal spacing for VMs under each VLAN
                const vmSpacing = vms.length === 1 ? 0 : 15 / Math.max(1, vms.length - 1); // 15% width spread
                const vmStartX = vlanX - (vms.length === 1 ? 0 : 7.5); // Center the group under VLAN
                const vmX = vmStartX + (vmIndex * vmSpacing);
                const vmY = 55; // Fixed Y position below VLAN (same level for all VMs)
                
                nodes.push({
                    id: vmId,
                    label: `VM ${cleanVmName(vm.name)}`,
                    type: 'vm',
                    x: vmX,
                    y: vmY,
                    vlan: vlanNumber,
                    visible: !collapsedVlans.has(vlanNumber),
                    vm
                });

                // Link VM to VLAN
                links.push({
                    source: vlanId,
                    target: vmId,
                    visible: !collapsedVlans.has(vlanNumber)
                });
            });
        });
    }

    function cleanVmName(name: string): string {
        const userID = data.userRange?.userID || data.userId || '';
        return name.replace(userID + '-', '').replace(/-/g, ' ');
    }

    function toggleVlan(vlanNumber: number) {
        if (collapsedVlans.has(vlanNumber)) {
            collapsedVlans.delete(vlanNumber);
        } else {
            collapsedVlans.add(vlanNumber);
        }
        
        nodes.forEach(node => {
            if (node.type === 'vm' && node.vlan === vlanNumber) {
                node.visible = !collapsedVlans.has(vlanNumber);
            }
        });
        
        links.forEach(link => {
            const targetNode = nodes.find(n => n.id === link.target);
            if (targetNode && targetNode.type === 'vm' && targetNode.vlan === vlanNumber) {
                link.visible = !collapsedVlans.has(vlanNumber);
            }
        });
        
        // Trigger reactivity
        nodes = nodes;
        links = links;
    }

    function getNodeColor(type: string): string {
        switch (type) {
            case 'router': return '#6b7280'; // Gray for router
            case 'vlan': return '#3b82f6'; // Blue for VLANs
            case 'vm': return '#059669'; // Green for VMs
            default: return '#64748b';
        }
    }

    function startDrag(event: MouseEvent, nodeId: string) {
        isDragging = true;
        dragTarget = event.target as SVGElement;
        
        const node = nodes.find(n => n.id === nodeId);
        if (node && svgElement) {
            const rect = svgElement.getBoundingClientRect();
            const svgX = (event.clientX - rect.left) / rect.width * 100;
            const svgY = (event.clientY - rect.top) / rect.height * 75;
            
            dragOffset.x = svgX - node.x;
            dragOffset.y = svgY - node.y;
        }
        
        event.preventDefault();
    }

    function handleMouseMove(event: MouseEvent) {
        if (isDragging && dragTarget) {
            const nodeId = dragTarget.getAttribute('data-node-id');
            const node = nodes.find(n => n.id === nodeId);
            
            if (node && svgElement) {
                const rect = svgElement.getBoundingClientRect();
                const svgX = (event.clientX - rect.left) / rect.width * 100;
                const svgY = (event.clientY - rect.top) / rect.height * 75;
                
                node.x = svgX - dragOffset.x;
                node.y = svgY - dragOffset.y;
                
                // Keep nodes within bounds - allow almost full canvas
                node.x = Math.max(0.5, Math.min(99.5, node.x));
                node.y = Math.max(3, Math.min(65, node.y));
                
                // Trigger reactivity
                nodes = nodes;
            }
        }
    }

    function stopDrag() {
        isDragging = false;
        dragTarget = null;
    }

    function goBack() {
        goto(`/pool/${data.poolId}`);
    }



    onMount(() => {
        if (!data.error && data.userRange?.VMs) {
            processNetworkData();
        }
        
        // Add global mouse event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopDrag);
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopDrag);
        };
    });
</script>

<div class="flex h-full w-full flex-1 flex-col p-6">
    {#if data.error}
        <!-- Error Display -->
        <div class="mb-6 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-4">
                <Button variant="outline" onclick={goBack} class="flex items-center gap-2">
                    <ArrowLeft class="h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h1 class="text-3xl font-bold">User: {data.userId}</h1>
                    <p class="text-sm text-muted-foreground">
                        Last deployed {data.userRange?.lastDeployment ? formatDate(data.userRange.lastDeployment) : 'N/A'} • 
                        Status: <span class="font-medium text-{data.userRange?.rangeState === 'SUCCESS' ? 'green' : 'red'}-600">
                            {data.userRange?.rangeState || 'Unknown'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
        
        <div class="flex-1 flex items-center justify-center">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-2xl w-full text-center">
                <div class="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                </div>
                <h2 class="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
                <p class="text-red-600 dark:text-red-300 mb-4">
                    {#if data.message}
                        {data.message}
                    {:else}
                        User <span class="font-medium">{data.userId}</span> has no range configured.
                    {/if}
                </p>
                <p class="text-sm text-red-500 dark:text-red-400">
                    {#if data.errorType === 'RANGE_STOPPED'}
                        You can start the VMs from the pool management interface.
                    {:else if data.errorType === 'NO_RANGE'}
                        The user may not have been deployed yet or the range may have been deleted.
                    {:else if data.errorType === 'NO_VMS'}
                        You can redeploy the range from the pool management interface.
                    {:else if data.errorType === 'ACCESS_DENIED'}
                        Contact your administrator to request access.
                    {:else}
                        Please check the configuration and try again.
                    {/if}
                </p>
            </div>
        </div>
    {:else}
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-4">
                <Button variant="outline" onclick={goBack} class="flex items-center gap-2">
                    <ArrowLeft class="h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h1 class="text-3xl font-bold">User: {data.userRange?.userID || data.userId}</h1>
                    {#if data.userRange?.lastDeployment}
                       <p class="text-sm text-muted-foreground">
                            Last deployed {formatDate(data.userRange.lastDeployment)} • 
                            Status: <span class="font-medium text-{data.userRange.rangeState === 'SUCCESS' ? 'green' : 'red'}-600">
                                {data.userRange.rangeState}
                            </span>
                        </p>
                    {/if}
                </div>
            </div>
        </div>

    <!-- Network Visualization -->
    <div class="flex-1 overflow-hidden border rounded-lg shadow-sm" style="background-color: #1a1a1a;">
        <svg 
            bind:this={svgElement}
            class="w-full h-full cursor-move"
            viewBox="0 0 100 75"
            preserveAspectRatio="xMidYMid meet"
            style="user-select: text; display: block;"
        >
            <!-- Links -->
            {#each links as link}
                {#if link.visible}
                    {@const sourceNode = nodes.find(n => n.id === link.source)}
                    {@const targetNode = nodes.find(n => n.id === link.target)}
                    {#if sourceNode && targetNode}
                        <line
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke="#9ca3af"
                            stroke-width="0.3"
                            opacity="0.8"
                        />
                    {/if}
                {/if}
            {/each}

            <!-- Nodes -->
            {#each nodes as node}
                {#if node.visible}
                    <g
                        data-node-id={node.id}
                        style="cursor: move;"
                        on:mousedown={(e) => startDrag(e, node.id)}
                        on:dblclick={() => node.type === 'vlan' && node.vlan !== undefined && toggleVlan(node.vlan)}
                        role="button"
                        tabindex="0"
                    >
                        <!-- Node rectangle -->
                        <rect
                            x={node.x - 2.5}
                            y={node.y - 2.5}
                            width="5"
                            height="5"
                            rx="0.8"
                            fill={getNodeColor(node.type)}
                            stroke="#000000"
                            stroke-width="0.2"
                            opacity="0.95"
                            data-node-id={node.id}
                        />
                        
                        <!-- Node label -->
                        <text
                            x={node.x}
                            y={node.y + 5.5}
                            text-anchor="middle"
                            class="fill-gray-200 font-medium pointer-events-none"
                            data-node-id={node.id}
                            style="font-size: 2px;"
                        >
                            {node.label}
                        </text>
                        
                        <!-- VM IP address -->
                        {#if node.type === 'vm' && node.vm}
                            <text
                                x={node.x}
                                y={node.y + 7.5}
                                text-anchor="middle"
                                class="fill-gray-400 cursor-text"
                                style="font-size: 1.5px; user-select: text; pointer-events: auto;"
                                on:mousedown|stopPropagation
                                role="button"
                                tabindex="0"
                            >
                                {node.vm.ip}
                            </text>
                        {/if}

                        <!-- Power state indicator for VMs -->
                        {#if node.type === 'vm' && node.vm}
                            <circle
                                cx={node.x + 2.2}
                                cy={node.y - 2.2}
                                r="0.8"
                                fill={node.vm.poweredOn === true? '#10b981' : '#ef4444'}
                                stroke="#000000"
                                stroke-width="0.15"
                                data-node-id={node.id}
                            />
                        {/if}

                        <!-- Node icon - painted last to be on top -->
                        <g class="pointer-events-none" data-node-id={node.id}>
                            {#if node.type === 'router'}
                                <!-- Router icon (Lucide router paths) -->
                                <g transform="translate({node.x - 1.2}, {node.y - 1.2}) scale(0.1)">
                                    <rect x="3" y="11" width="18" height="10" rx="2" fill="none" stroke="white" stroke-width="2"/>
                                    <circle cx="12" cy="5" r="2" fill="none" stroke="white" stroke-width="2"/>
                                    <path d="m12 7-2 4h4l-2-4Z" fill="white"/>
                                    <circle cx="6" cy="16" r="1" fill="white"/>
                                    <circle cx="18" cy="16" r="1" fill="white"/>
                                </g>
                            {:else if node.type === 'vlan'}
                                <!-- ArrowLeftRight icon (Lucide arrow-left-right paths) -->
                                <g transform="translate({node.x - 1.2}, {node.y - 1.2}) scale(0.1)">
                                    <path d="M8 3L4 7l4 4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M4 7h16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="m16 21 4-4-4-4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M20 17H4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </g>
                            {:else if node.type === 'vm'}
                                <!-- HardDrive icon (Lucide hard-drive paths) -->
                                <g transform="translate({node.x - 1.2}, {node.y - 1.2}) scale(0.1)">
                                    <line x1="22" y1="12" x2="2" y2="12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="6" cy="16" r="1" fill="white"/>
                                    <circle cx="10" cy="16" r="1" fill="white"/>
                                </g>
                            {/if}
                        </g>
                    </g>
                {/if}
            {/each}
        </svg>
    </div>
    {/if}
</div>