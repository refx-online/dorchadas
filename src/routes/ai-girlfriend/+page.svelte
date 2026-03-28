<script lang="ts">
	import AiGirlfriend from '$lib/components/AiGirlfriend.svelte';
	import { userData, userLanguage } from '$lib/storage';
	import { __ } from '$lib/language';
	import { fade } from 'svelte/transition';

	$: isLoggedIn = !!$userData;
</script>

<svelte:head>
	<title>{__('AI Girlfriend', $userLanguage)}</title>
</svelte:head>

<div class="container mx-auto p-4 md:p-8 flex flex-col items-center gap-8">
	<div class="text-center space-y-2">
		<h1 class="h1 font-bold text-error-500">Your AI Girlfriend</h1>
		<p class="text-surface-400 max-w-lg mx-auto">
			She's always here for you. Whether you like it or not. Mostly not.
		</p>
	</div>

	{#if isLoggedIn}
		<div class="w-full" in:fade>
			<AiGirlfriend />
		</div>
	{:else}
		<div class="card p-8 variant-filled-surface text-center space-y-4 max-w-md" in:fade>
			<div class="text-4xl">🔒</div>
			<h2 class="h2 font-bold">{__('Access Denied', $userLanguage)}</h2>
			<p>
				{__(
					'You must be logged in to talk to your AI girlfriend. She doesn’t talk to strangers.',
					$userLanguage
				)}
			</p>
			<div class="flex flex-col sm:flex-row gap-2 justify-center pt-4">
				<a href="/signin" class="btn variant-filled-primary">{__('Sign In', $userLanguage)}</a>
				<a href="/signup" class="btn variant-ghost-surface">{__('Sign Up', $userLanguage)}</a>
			</div>
		</div>
	{/if}
</div>
