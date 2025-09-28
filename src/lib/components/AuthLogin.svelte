<script lang="ts">
	import { setApiKey, validateApiKey } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import * as Alert from '$lib/components/ui/alert';
	import { AlertCircle, Key } from 'lucide-svelte';
	
	let apiKey = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleLogin() {
		if (!apiKey.trim()) {
			error = 'Please enter your API key';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const isValid = await validateApiKey(apiKey.trim());

			if (isValid) {
				setApiKey(apiKey.trim());
			} else {
				error = 'Invalid API key. Please check your key and try again.';
			}
		} catch (err) {
			error = 'Failed to validate API key. Please check your connection.';
		}

		isLoading = false;
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleLogin();
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen bg-background">
	<Card.Root class="w-[420px] shadow-xl">
		<Card.Header class="text-center space-y-2">
			<div class="flex items-center justify-center mb-4">
				<div class="p-3 bg-muted rounded-full">
					<Key class="h-8 w-8 text-foreground" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">Welcome to Ludus</Card.Title>
			<Card.Description>
				Enter your API key to access the Ludus management interface
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
				<div class="space-y-2">
					<Label for="apikey">API Key</Label>
					<Input
						id="apikey"
						type="password"
						placeholder="Enter your API key"
						bind:value={apiKey}
						disabled={isLoading}
						onkeydown={handleKeyPress}
					/>
				</div>
				
				{#if error}
					<Alert.Root variant="destructive">
						<AlertCircle class="h-4 w-4" />
						<Alert.Title>Authentication Failed</Alert.Title>
						<Alert.Description>{error}</Alert.Description>
					</Alert.Root>
				{/if}

				<Button 
					type="submit" 
					class="w-full" 
					disabled={isLoading || !apiKey.trim()}
				>
					{#if isLoading}
						<div class="flex items-center space-x-2">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
							<span>Validating...</span>
						</div>
					{:else}
						Sign In
					{/if}
				</Button>
			</form>

			<div class="mt-6 text-center text-sm text-muted-foreground">
				<p>Need help? Contact your administrator for an API key.</p>
			</div>
		</Card.Content>
	</Card.Root>
</div>
