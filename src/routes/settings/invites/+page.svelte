<script lang="ts">
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import { invalidateAll } from '$app/navigation';
	import { appName } from '$lib/env';

	export let data;

	let isLoading = false;
	let message = '';
	let messageType: 'success' | 'error' = 'success';

	function showMessage(text: string, type: 'success' | 'error') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
		}, 5000);
	}

	async function respond(inviteId: number, status: 'accepted' | 'rejected') {
		isLoading = true;
		try {
			const response = await fetch('/settings/invites/respond', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					inviteId,
					status
				})
			});

			if (response.ok) {
				showMessage(
					status === 'accepted'
						? __('Successfully joined the clan!', $userLanguage)
						: __('Invite rejected.', $userLanguage),
					'success'
				);
				await invalidateAll();
			} else {
				const result = await response.json();
				showMessage(result.message || __('An error occurred', $userLanguage), 'error');
			}
		} catch {
			showMessage(__('An error occurred', $userLanguage), 'error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{appName} :: {__('Clan Invites', $userLanguage)}</title>
</svelte:head>

<div class="container h-full mx-auto py-10 px-4">
	<div class="card p-6 w-full max-w-4xl mx-auto shadow-xl bg-surface-800">
		<header class="mb-8 flex justify-between items-center">
			<h2 class="h2">{__('Clan Invites', $userLanguage)}</h2>
			<a href="/settings" class="btn variant-soft">
				{__('Back to Settings', $userLanguage)}
			</a>
		</header>

		{#if message}
			<div
				class="alert mb-6 {messageType === 'success' ? 'variant-filled-success' : 'variant-filled-error'}"
			>
				<p>{message}</p>
			</div>
		{/if}

		{#if data.invites && data.invites.length > 0}
			<div class="grid grid-cols-1 gap-4">
				{#each data.invites as invite}
					<div class="card p-4 variant-soft flex flex-col md:flex-row justify-between items-center gap-4">
						<div class="flex items-center gap-4">
							<img
								src="/api/clan/{invite.clan_id}/flag"
								alt={invite.clan_tag}
								class="h-10 aspect-[3/2] rounded-md object-cover"
								on:error={(e) => {
									e.currentTarget.style.display = 'none';
								}}
							/>
							<div>
								<p class="text-lg font-bold">{invite.clan_name} [{invite.clan_tag}]</p>
								<p class="text-sm opacity-75">{__('Invited you to join their clan', $userLanguage)}</p>
							</div>
						</div>
						<div class="flex gap-2">
							<button
								class="btn variant-filled-success"
								on:click={() => respond(invite.id, 'accepted')}
								disabled={isLoading}
							>
								{__('Accept', $userLanguage)}
							</button>
							<button
								class="btn variant-filled-error"
								on:click={() => respond(invite.id, 'rejected')}
								disabled={isLoading}
							>
								{__('Reject', $userLanguage)}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-10">
				<p class="text-xl opacity-50">{__('You have no pending invites.', $userLanguage)}</p>
			</div>
		{/if}
	</div>
</div>
