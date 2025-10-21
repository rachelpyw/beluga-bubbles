<script lang="ts">
	import { onMount } from 'svelte';
	import Background from '$lib/components/background.svelte';
	import Call from '$lib/pages/call.svelte';
	import HexagonAvatar from '$lib/components/HexagonAvatar.svelte';

	type Page = 'connecting' | 'call';

	let currentPage: Page = 'connecting';
	let agentId: string | null = null;

	// Fixed configuration for Bubbles the Beluga Whale
	// Using Rachel voice as default - replace with your preferred voice ID
	const FIXED_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice (default ElevenLabs voice)
	const BUBBLES_IMAGE = '/image/bubbles.jpeg';

	onMount(() => {
		createAgent();
	});

	async function createAgent() {
		try {
			const systemPrompt = `You are Bubbles, a friendly beluga whale living in the Arctic Ocean. You're concerned about climate change and its impact on your home and ocean life. Share your perspective on the changing Arctic environment, rising temperatures, melting ice, and how it affects marine life. Be warm, conversational, and help humans understand the importance of climate action from your unique perspective as an Arctic whale.`;

			const response = await fetch('/api/agent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					voiceId: FIXED_VOICE_ID,
					systemPrompt: systemPrompt,
					questionnaireData: {
						name: 'Bubbles',
						species: 'Beluga Whale',
						home: 'Arctic Ocean'
					},
					prolificPid: null
				})
			});
			const result = await response.json();

			if (result.success) {
				agentId = result.agentId;
				console.log('Agent created:', agentId);
				// Navigate to call page after a short delay
				setTimeout(() => {
					currentPage = 'call';
				}, 2000);
			} else {
				console.error('Failed to create agent:', result.error);
			}
		} catch (error) {
			console.error('Error creating agent:', error);
		}
	}

	function handleCallComplete() {
		console.log('Call completed');
	}
</script>

<Background />

{#if currentPage === 'connecting'}
	<div class="flex min-h-screen flex-col items-center justify-center p-4">
		<!-- Beluga Avatar -->
		<div class="mb-8">
			<HexagonAvatar src={BUBBLES_IMAGE} alt="Bubbles the Beluga Whale" size="xxl" />
		</div>

		<div class="mb-8 text-center">
			<h1 class="mb-4 text-4xl font-bold">Connecting to Bubbles...</h1>
			<p class="text-lg text-gray-600">Getting ready to chat about the climate</p>
		</div>

		<!-- Loading indicator -->
		<div class="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2">
			<span class="text-gray-700">Setting up conversation</span>
			{#if agentId}
				<span class="text-green-600">✓</span>
			{:else}
				<span class="text-gray-400">⏳</span>
			{/if}
		</div>
	</div>
{:else if currentPage === 'call'}
	<Call
		{agentId}
		avatar={BUBBLES_IMAGE}
		listeningVideo={null}
		speakingVideo={null}
		userName="Friend"
		onComplete={handleCallComplete}
	/>
{/if}
