<script lang="ts">
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';
	import { appName } from '$lib/env';
	import { enhance } from '$app/forms';

	export let data;
	export let form;

	let isLoading = false;
</script>

<svelte:head>
	<title>{appName} :: {__('Create Clan', $userLanguage)}</title>
</svelte:head>

<div class="container h-full mx-auto flex justify-center items-center py-10 px-4">
	<div class="card p-6 w-full max-w-lg shadow-xl bg-surface-800">
		<header class="mb-8">
			<h2 class="h2 text-center">{__('Create a Clan', $userLanguage)}</h2>
		</header>

		{#if form?.message}
			<div class="alert variant-filled-error mb-6">
				<p>{form.message}</p>
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				isLoading = true;
				return async ({ update }) => {
					isLoading = false;
					update();
				};
			}}
			class="space-y-6"
		>
			<label class="label">
				<span>{__('Clan Name', $userLanguage)}</span>
				<input
					name="name"
					type="text"
					class="input"
					placeholder={__('Enter clan name (2-32 characters)', $userLanguage)}
					minlength="2"
					maxlength="32"
					required
					disabled={isLoading}
				/>
			</label>

			<label class="label">
				<span>{__('Clan Tag', $userLanguage)}</span>
				<input
					name="tag"
					type="text"
					class="input uppercase"
					placeholder={__('Enter clan tag (2-6 characters)', $userLanguage)}
					minlength="2"
					maxlength="6"
					required
					disabled={isLoading}
				/>
			</label>

			<div class="flex justify-between items-center pt-4">
				<a href="/clans" class="btn variant-ghost-surface">
					{__('Cancel', $userLanguage)}
				</a>
				<button type="submit" class="btn variant-filled-primary" disabled={isLoading}>
					{#if isLoading}
						{__('Creating...', $userLanguage)}
					{:else}
						{__('Create Clan', $userLanguage)}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
