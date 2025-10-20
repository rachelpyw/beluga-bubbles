<script lan	// Fixed configuration for Bubbles the Beluga Whale
	const FIXED_VOICE_ID = 'pPdl9cQBQq4p6mRkZy2Z';
	const BUBBLES_IMAGE = '/image/bubbles.jpeg';
	const BUBBLES_NAME = 'Bubbles';">
	import { onMount } from 'svelte';
	import Background from '$lib/components/background.svelte';
	import Connecting from '$lib/pages/connecting.svelte';
	import Call from '$lib/pages/call.svelte';

	type Page = 'connecting' | 'call';

	let currentPage: Page = 'connecting';
	let agentId: string | null = null;

	// Fixed configuration for Bubbles the Beluga
	const FIXED_VOICE_ID = 'pPdl9cQBQq4p6mRkZy2Z';
	const BELUGA_IMAGE = '/image/bubbles.jpeg'; // You'll need to upload this
	const questionnaireData = {}; // Empty since we're not using a questionnaire
	const claudeMemory = ''; // Empty since we're not using memory

	onMount(() => {
		createAgent();
	});

	async function createAgent() {
		try {
			const response = await fetch('/api/agent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					voiceId: FIXED_VOICE_ID,
					systemPrompt: '',
					questionnaireData: {},
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
		// Could redirect somewhere or show a thank you message
	}
</script>

<Background />

{#if currentPage === 'connecting'}
	<Connecting
		claudeMemory={claudeMemory}
		agedPhotoUrl={BELUGA_IMAGE}
		listeningVideoUrl={null}
		speakingVideoUrl={null}
		voiceCloneId={FIXED_VOICE_ID}
		{agentId}
	/>
{:else if currentPage === 'call'}
	<Call
		{agentId}
		avatar={BELUGA_IMAGE}
		listeningVideo={null}
		speakingVideo={null}
		userName="Friend"
		onComplete={handleCallComplete}
	/>
{/if}
		return result; // Returns { agedPhoto, listeningVideo, speakingVideo }
	}

	async function processVoice(audioBlob: Blob) {
		const formData = new FormData();
		formData.append('audio', audioBlob, 'recording.webm');
		formData.append('name', prolificPid ? `iui26_${prolificPid}` : 'Voice Clone');
		formData.append('description', 'Voice clone from recording');
		const response = await fetch('/api/voice-clone', { method: 'POST', body: formData });
		const result = await response.json();
		return result.voiceId;
	}

	async function createAgent() {
		if (!voiceCloneId || !claudeMemory) {
			console.error('Cannot create agent: missing voice ID or Claude memory');
			return;
		}

		try {
			const response = await fetch('/api/agent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					voiceId: voiceCloneId,
					systemPrompt: claudeMemory,
					questionnaireData: questionnaireData,
					prolificPid: prolificPid
				})
			});
			const result = await response.json();

			if (result.success) {
				agentId = result.agentId;
				console.log('Agent created:', agentId);
				updateLocalStorage({ agentId });
			} else {
				console.error('Failed to create agent:', result.error);
			}
		} catch (error) {
			console.error('Error creating agent:', error);
		}
	}

	async function saveAllToFirebase() {
		// Wait for all: claudeMemory, agedPhotoUrl, listeningVideoUrl, speakingVideoUrl, voiceCloneId, and agentId
		if (
			!claudeMemory ||
			!agedPhotoUrl ||
			!listeningVideoUrl ||
			!speakingVideoUrl ||
			!voiceCloneId ||
			!agentId
		)
			return;

		try {
			const id = await saveToFirebase('ftu-iui', {
				timestamp: new Date().toISOString(),
				profile: JSON.stringify(questionnaireData),
				memory: claudeMemory,
				photo: agedPhotoUrl,
				listeningVideo: listeningVideoUrl,
				speakingVideo: speakingVideoUrl,
				voiceId: voiceCloneId,
				agentId: agentId,
				prolificPid: prolificPid,
				studyId: studyId,
				sessionId: sessionId
			});
			console.log('Saved to Firebase:', id);
		} catch (error) {
			console.error('Error saving to Firebase:', error);
		}
	}

	// Watch for changes and trigger agent creation when ready
	$: if (
		claudeMemory &&
		agedPhotoUrl &&
		listeningVideoUrl &&
		speakingVideoUrl &&
		voiceCloneId &&
		!agentId
	) {
		createAgent();
	}

	// Save to Firebase and navigate to call when all are ready
	$: if (
		claudeMemory &&
		agedPhotoUrl &&
		listeningVideoUrl &&
		speakingVideoUrl &&
		voiceCloneId &&
		agentId
	) {
		saveAllToFirebase();
		// Navigate to call page after a short delay
		setTimeout(() => {
			currentPage = 'call';
		}, 2000);
	}

	function handleSurveyComplete() {
		currentPage = 'photo';
	}

	function handleCallComplete() {
		currentPage = 'post-survey';
	}

	function handlePostSurveyComplete() {
		// Redirect to Prolific completion
		window.location.href = 'https://app.prolific.com/submissions/complete?cc=CUKPH3D8';
	}

	function handleQuestionnaireComplete(event: CustomEvent) {
		questionnaireData = event.detail;
		console.log('Questionnaire completed:', questionnaireData);

		// Save questionnaire data to localStorage
		updateLocalStorage({
			timestamp: new Date().toISOString(),
			profile: JSON.stringify(questionnaireData)
		});

		// Process in background
		processQuestionnaire(questionnaireData)
			.then((memory) => {
				claudeMemory = memory;
				console.log('Generated memory:', memory);
				updateLocalStorage({ memory });
			})
			.catch((error) => console.error('Error processing questionnaire:', error));

		currentPage = 'voice';
	}

	function handlePhotoComplete(event: CustomEvent) {
		photoData = event.detail;
		console.log('Photo completed:', photoData);

		if (!photoData?.imageFile) {
			currentPage = 'questionnaire';
			return;
		}

		// Process in background
		processPhoto(photoData.imageFile)
			.then((result) => {
				agedPhotoUrl = result.agedPhoto;
				listeningVideoUrl = result.listeningVideo;
				speakingVideoUrl = result.speakingVideo;
				console.log('Replicate aged photo:', result.agedPhoto);
				console.log('Replicate listening video:', result.listeningVideo);
				console.log('Replicate speaking video:', result.speakingVideo);
				console.log('Updating localStorage with photo and videos');
				updateLocalStorage({
					photo: result.agedPhoto,
					listeningVideo: result.listeningVideo,
					speakingVideo: result.speakingVideo
				});
			})
			.catch((error) => console.error('Error processing photo:', error));

		currentPage = 'questionnaire';
	}

	function handleVoiceComplete(event: CustomEvent) {
		voiceData = event.detail;
		console.log('Voice completed:', voiceData);

		if (!voiceData?.audioBlob) return;

		// Navigate to connecting page
		currentPage = 'connecting';

		// Process voice in background
		processVoice(voiceData.audioBlob)
			.then((voiceId) => {
				voiceCloneId = voiceId;
				console.log('Voice clone created:', voiceId);
				console.log('Updating localStorage with voiceId');
				updateLocalStorage({ voiceId });
			})
			.catch((error) => console.error('Error processing voice:', error));

		console.log('All data collected:', { questionnaireData, photoData, voiceData });
	}
</script>

<Background />

{#if currentPage === 'survey'}
	<PreSurvey onNext={handleSurveyComplete} {prolificPid} />
{:else if currentPage === 'photo'}
	<Photo on:complete={handlePhotoComplete} />
{:else if currentPage === 'questionnaire'}
	<Questionnaire on:complete={handleQuestionnaireComplete} />
{:else if currentPage === 'voice'}
	<VoiceUpload on:complete={handleVoiceComplete} />
{:else if currentPage === 'connecting'}
	<Connecting
		{claudeMemory}
		{agedPhotoUrl}
		{listeningVideoUrl}
		{speakingVideoUrl}
		{voiceCloneId}
		{agentId}
	/>
{:else if currentPage === 'call'}
	<Call
		{agentId}
		avatar={agedPhotoUrl || '/image/profile.jpeg'}
		listeningVideo={listeningVideoUrl}
		speakingVideo={speakingVideoUrl}
		userName={String(questionnaireData.name || 'You')}
		onComplete={handleCallComplete}
	/>
{:else if currentPage === 'post-survey'}
	<PostSurvey onNext={handlePostSurveyComplete} {prolificPid} />
{:else if currentPage === 'complete'}
	<div class="flex min-h-screen items-center justify-center p-4">
		<div class="text-center">
			<h1 class="mb-4 text-3xl font-bold text-green-600">Study Complete!</h1>
			<p class="text-lg text-gray-600">Thank you for your participation.</p>
			<p class="text-sm text-gray-500">You may now close this window.</p>
		</div>
	</div>
{/if}
