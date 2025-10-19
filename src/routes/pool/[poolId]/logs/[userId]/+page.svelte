<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { Button } from '$lib/components/ui/button';
    import * as Alert from '$lib/components/ui/alert';
    import { 
        RefreshCw, 
        AlertCircle, 
        CheckCircle2, 
        X,
        Download,
        ArrowLeft,
        Play,
        Pause
    } from 'lucide-svelte';
    import { getUserLogs as fetchUserLogs } from '$lib/api/client/users.client.js';

    let poolId: string = $page.params.poolId!;
    let userId: string = $page.params.userId!;
    
    // Log viewer state
    let logContent = $state<string>('');
    let logCursor = $state(0);
    let isLoadingLogs = $state(false);
    let logError = $state<string | null>(null);
    let isStreaming = $state(false);
    let streamingInterval: ReturnType<typeof setInterval> | null = $state(null);
    let playbookCompleted = $derived(logContent.includes('PLAY RECAP *********************************************************************'));
    let alertMessage = $state<{ message: string; type: 'success' | 'error' } | null>(null);

    // Cleanup streaming when component is destroyed
    $effect(() => {
        return () => {
            if (streamingInterval) {
                clearInterval(streamingInterval);
            }
        };
    });

    // Load logs when component mounts
    $effect(() => {
        loadUserLogs(userId);
    });

    // Log management functions
    async function loadUserLogs(userId: string, initialTail: number = 1000) {
        isLoadingLogs = true;
        logError = null;
        
        try {
            // First, try to get as many logs as possible
            const response = await fetchUserLogs(userId, initialTail, 0);
            logContent = response.result;
            logCursor = response.cursor;
            
            // Check if the playbook has already completed
            if (response.result && response.result.includes('PLAY RECAP *********************************************************************')) {
                // Don't start streaming if already completed
                return;
            }
            
            // Start continuous streaming if logs were loaded successfully and playbook not completed
            if (response.result) {
                startLogStreaming(userId);
            }
        } catch (error: any) {
            logError = error.message || 'Failed to load logs';
            logContent = '';
        } finally {
            isLoadingLogs = false;
        }
    }

    function startLogStreaming(userId: string) {
        if (streamingInterval) {
            clearInterval(streamingInterval);
        }
        
        isStreaming = true;
        
        // Fetch new logs every 3 seconds
        streamingInterval = setInterval(async () => {
            try {
                const response = await fetchUserLogs(userId, 100, logCursor);
                
                // Only append if there's new content and it's different from what we already have
                if (response.result && response.result.trim()) {
                    // Check if the new content is already at the end of our existing logs
                    const newContent = response.result;
                    const existingEnd = logContent.slice(-newContent.length);
                    
                    // Only append if the new content is different from the end of existing content
                    if (newContent !== existingEnd) {
                        logContent += newContent;
                        logCursor = response.cursor;
                    }
                    
                    // Check if we've reached the end of the playbook (PLAY RECAP indicates completion)
                    if (response.result.includes('PLAY RECAP *********************************************************************')) {
                        stopLogStreaming();
                        showAlert('Playbook completed', 'success');
                    }
                }
            } catch (error: any) {
                console.error('Error streaming logs:', error);
                // Don't stop streaming on error, just log it
            }
        }, 3000);
    }

    function stopLogStreaming() {
        if (streamingInterval) {
            clearInterval(streamingInterval);
            streamingInterval = null;
        }
        isStreaming = false;
    }

    async function refreshLogs() {
        // Stop current streaming
        stopLogStreaming();
        
        // Reset and reload logs
        logContent = '';
        logCursor = 0;
        await loadUserLogs(userId);
    }

    async function loadMoreLogs() {
        if (isLoadingLogs) return;
        
        // Temporarily stop streaming to avoid conflicts
        const wasStreaming = isStreaming;
        if (wasStreaming) {
            stopLogStreaming();
        }
        
        isLoadingLogs = true;
        
        try {
            const response = await fetchUserLogs(userId, 500, logCursor);
            
            // Only append if there's new content and it's different from what we already have
            if (response.result && response.result.trim()) {
                const newContent = response.result;
                const existingEnd = logContent.slice(-newContent.length);
                
                // Only append if the new content is different from the end of existing content
                if (newContent !== existingEnd) {
                    logContent += newContent;
                    logCursor = response.cursor;
                }
            }
            
            // Resume streaming if it was active
            if (wasStreaming) {
                startLogStreaming(userId);
            }
        } catch (error: any) {
            showAlert('Failed to load more logs', 'error');
            
            // Resume streaming even on error if it was active
            if (wasStreaming) {
                startLogStreaming(userId);
            }
        } finally {
            isLoadingLogs = false;
        }
    }

    // Download logs for the current user
    async function downloadCurrentUserLogs() {
        try {
            // Download all the logs we have fetched instead of just the last 100 lines
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${userId}_logs.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showAlert(`Logs for ${userId} downloaded successfully`, 'success');
        } catch (error) {
            showAlert(`Failed to download logs for ${userId}`, 'error');
        }
    }

    function showAlert(message: string, type: 'success' | 'error') {
        alertMessage = { message, type };
        setTimeout(() => {
            alertMessage = null;
        }, 5000);
    }

    function hideAlert() {
        alertMessage = null;
    }

    function goBack() {
        goto(`/pool/${poolId}`);
    }

    function toggleStreaming() {
        if (isStreaming) {
            stopLogStreaming();
        } else if (!playbookCompleted) {
            startLogStreaming(userId);
        }
    }
</script>

<div class="flex h-full w-full flex-1 flex-col p-6 overflow-hidden">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-4">
            <Button variant="outline" onclick={goBack} class="flex items-center gap-2">
                <ArrowLeft class="h-4 w-4" />
                Back
            </Button>
            <div>
                <h1 class="text-3xl font-bold">Logs for {userId}</h1>
                <p class="text-sm text-muted-foreground">Selected Pool {poolId}</p>
            </div>
        </div>
    </div>

    <!-- Status Navigation Tabs -->
    <div class="mb-6 flex items-center justify-between flex-shrink-0">
        <div class="flex rounded-lg bg-gray-100 dark:bg-zinc-900 p-1 gap-1">
            <Button variant="outline" class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">streaming</span>
                <div class="w-3 h-3 rounded-full {isStreaming ? 'bg-green-500' : 'bg-grey-500'}"></div>
            </Button>
            <Button variant="outline" class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <span class="text-base font-medium">playbook completed</span>
                <div class="w-3 h-3 rounded-full {playbookCompleted ? 'bg-green-500' : 'bg-yellow-500'}"></div>
            </Button>
            <Button variant="outline" class="rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm min-w-32">
                <span class="text-base font-medium whitespace-nowrap">cursor {logCursor}</span>
            </Button>
        </div>
        
        <!-- Action Buttons on the right -->
        <div class="flex items-center gap-2">
            <Button 
                variant="outline" 
                onclick={toggleStreaming}
                disabled={playbookCompleted || isLoadingLogs}
                class="flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm"
            >
                {#if isStreaming}
                    <Pause class="h-4 w-4" />
                    <span>stop streaming</span>
                {:else}
                    <Play class="h-4 w-4" />
                    <span>start streaming</span>
                {/if}
            </Button>
            <Button 
                variant="outline" 
                onclick={refreshLogs}
                disabled={isLoadingLogs}
                class="flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm"
            >
                <RefreshCw class="h-4 w-4 {isLoadingLogs ? 'animate-spin' : ''}" />
                <span>refresh</span>
            </Button>
            <Button 
                variant="outline"
                onclick={downloadCurrentUserLogs}
                class="flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm"
            >
                <Download class="h-4 w-4" />
                <span>download</span>
            </Button>
        </div>
    </div>

    <!-- Floating Alert Messages -->
    {#if alertMessage}
        <div class="fixed top-12 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl animate-in slide-in-from-top-2">
            <Alert.Root variant={alertMessage.type === 'error' ? 'destructive' : 'default'} class="shadow-lg border">
                {#if alertMessage.type === 'error'}
                    <AlertCircle class="h-4 w-4" />
                {:else}
                    <CheckCircle2 class="h-4 w-4" />
                {/if}
                <Alert.Title class="text-sm font-medium">
                    {alertMessage.type === 'error' ? 'Error' : 'Success'}
                </Alert.Title>
                <Alert.Description class="text-sm flex items-start justify-between pr-2">
                    <pre class="whitespace-pre-wrap text-wrap break-words text-sm max-w-full">{alertMessage.message}</pre>
                    <Button variant="ghost" size="sm" onclick={hideAlert} class="h-6 w-6 p-0 ml-2 flex-shrink-0">
                        <X class="h-4 w-4" />
                    </Button>
                </Alert.Description>
            </Alert.Root>
        </div>
    {/if}

    <!-- Log Content -->
    <div class="flex-1 overflow-hidden border rounded-lg shadow-sm mb-6" style="background-color: #1a1a1a;">
        <div class="h-full w-full overflow-y-auto overflow-x-auto p-4" style="background-color: #1a1a1a; color: #ffffff;">
            {#if isLoadingLogs && !logContent}
                <div class="flex items-center justify-center h-32">
                    <div class="text-center space-y-2">
                        <div class="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
                        <p style="color: #ffffff;">Loading logs...</p>
                    </div>
                </div>
            {:else if logError}
                <div class="flex items-center justify-center h-32">
                    <div class="text-center space-y-2">
                        <AlertCircle class="h-6 w-6 text-red-500 mx-auto" />
                        <p class="text-red-500">{logError}</p>
                        <Button onclick={() => loadUserLogs(userId)} variant="outline" size="sm">
                            Retry
                        </Button>
                    </div>
                </div>
            {:else if logContent}
                <pre class="whitespace-pre-wrap break-words leading-relaxed font-mono" style="color: #ffffff;">{logContent}</pre>
                
                {#if !playbookCompleted && !isStreaming}
                    <div class="mt-4 pt-4" style="border-top: 1px solid #444444;">
                        <Button onclick={loadMoreLogs} variant="outline" size="sm" disabled={isLoadingLogs}>
                            {#if isLoadingLogs}
                                <RefreshCw class="h-4 w-4 animate-spin mr-2" />
                                Loading...
                            {:else}
                                Load More
                            {/if}
                        </Button>
                    </div>
                {/if}
            {:else}
                <div class="flex items-center justify-center h-32">
                    <p style="color: #888888;">No logs available</p>
                </div>
            {/if}
        </div>
    </div>
</div>
