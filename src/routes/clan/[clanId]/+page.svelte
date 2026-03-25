<script lang="ts">
	import { appName, appUrl, avatarUrl } from '$lib/env';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import Frown from 'svelte-feathers/Frown.svelte';

	import { invalidateAll } from '$app/navigation';
	export let data;

	let isLoading = false;

	async function handleClanLeave() {
		if (
			!confirm(
				data.isOwner
					? __('Are you sure you want to delete this clan?', $userLanguage)
					: __('Are you sure you want to leave this clan?', $userLanguage)
			)
		) {
			return;
		}

		isLoading = true;
		try {
			const response = await fetch(`/clan/${data.clan.id}/leave`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.href = '/';
			} else {
				alert(__('An error occurred while leaving the clan', $userLanguage));
			}
		} catch {
			alert(__('An error occurred while leaving the clan', $userLanguage));
		} finally {
			isLoading = false;
		}
	}

	async function handleClanRequest() {
		isLoading = true;
		try {
			const response = await fetch(`/clan/${data.clan.id}/request`, {
				method: 'POST'
			});

			if (response.ok) {
				alert(__('Request sent successfully!', $userLanguage));
				invalidateAll();
			} else {
				const result = await response.json();
				alert(result.message || __('An error occurred while requesting to join', $userLanguage));
			}
		} catch {
			alert(__('An error occurred while requesting to join', $userLanguage));
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	{#if data.clan?.id}
		<title>{appName} :: {data.clan.name} - clan info</title>
		<meta property="og:type" content="profile" />
		<meta property="og:title" content="{data.clan.name} - clan info" />
		<meta property="og:url" content="{appUrl}/clan/{data.clan.id}" />
		<meta property="profile:username" content={data.clan.name} />
	{:else}
		<title>{appName} :: clan not found</title>
	{/if}
</svelte:head>
<div class="container mx-auto w-full p-5">
	{#if data.clan !== undefined}
		{@const owner = data.clan.owner}
		{@const members = data.clan.members.filter((member) => member.id != owner.id).length}
		<div class="mx-auto card overflow-hidden">
			<div class="w-full flex flex-col">
				<div class="relative flex flex-row justify-between bg-surface-600 p-3">
					<div class="flex flex-col my-auto gap-1 md:gap-2 ms-2 z-10">
						<div class="flex flex-row items-center gap-2 text-xl md:text-2xl">
							<div class="h-8">
								<img
									src="/api/clan/{data.clan.id}/flag"
									alt={data.clan.tag}
									class="h-full aspect-[3/2] rounded-md object-cover"
									on:error={(e) => {
										e.currentTarget.style.display = 'none';
										e.currentTarget.nextElementSibling.style.display = 'inline-block';
									}}
								/>
								<p class="chip cursor-auto variant-filled-primary" style="display: none;">
									{data.clan.tag}
								</p>
							</div>
							{data.clan.name}
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if data.isOwner}
							<a href="/clan/{data.clan.id}/settings" class="btn variant-filled-surface">
								{__('Settings', $userLanguage)}
							</a>
						{/if}
						{#if data.isMember}
							<button
								class="btn {data.isOwner ? 'variant-filled-error' : 'variant-filled-surface'}"
								on:click={handleClanLeave}
								disabled={isLoading}
							>
								{data.isOwner ? __('Delete Clan', $userLanguage) : __('Leave Clan', $userLanguage)}
							</button>
						{:else if data.currentUser && data.currentUser.clanId === 0}
							{#if data.hasPendingRequest}
								<button class="btn variant-filled-surface" disabled>
									{__('Request Pending', $userLanguage)}
								</button>
							{:else}
								<button
									class="btn variant-filled-primary"
									on:click={handleClanRequest}
									disabled={isLoading}
								>
									{__('Join Clan', $userLanguage)}
								</button>
							{/if}
						{/if}
					</div>
				</div>
				<div class="w-full flex flex-col gap-3 items-center justify-center p-3 bg-surface-800">
					<div class="w-full text-center">
						<p class="text-4xl mb-3">{__('Clan Owner', $userLanguage)}</p>
						<div
							class=" mx-auto w-[50%] flex flex-row items-center gap-3 bg-surface-700 p-3 rounded-lg"
						>
							<img
								class="w-10 h-10 md:w-16 md:h-16 rounded-[30%]"
								src={avatarUrl + '/' + data.clan.owner.id}
								alt="playerProfile"
							/>
							<img
								class="w-7"
								src="/flags/{data.clan.owner.country.toUpperCase()}.png"
								alt="country flag"
							/>
							<a
								class="text-primary-500 hover:text-primary-300 transition-colors"
								href="/u/{data.clan.owner.id}">{data.clan.owner.name}</a
							>
						</div>
					</div>
					<div class="w-full text-center">
						<p class="text-4xl mb-3">{__('Clan Members', $userLanguage)}</p>
						<div
							class="mx-auto {members <= 0
								? 'flex flex-col justify-center items-center'
								: 'grid grid-cols-2'} gap-2"
						>
							{#if members <= 0}
								<div
									class=" mx-auto flex flex-row items-center justify-center gap-3 bg-surface-700 w-fit px-24 py-6 rounded-lg"
								>
									<Frown class="pointer-events-none" size={42}></Frown>
									<p class="text-gray-300 font-semibold">{__('No members yet.', $userLanguage)}</p>
								</div>
							{:else}
								{#each data.clan.members as member}
									{#if member.id != data.clan.owner.id}
										<div
											class=" mx-auto flex flex-row items-center gap-3 bg-surface-700 w-full p-3 rounded-lg"
										>
											<img
												class="w-10 h-10 md:w-16 md:h-16 rounded-[30%]"
												src={avatarUrl + '/' + member.id}
												alt="playerProfile"
											/>
											<img
												class="w-7"
												src="/flags/{member.country.toUpperCase()}.png"
												alt="country flag"
											/>
											<a
												class="text-primary-500 hover:text-primary-300 transition-colors"
												href="/u/{member.id}">{member.name}</a
											>
										</div>
									{/if}
								{/each}
							{/if}
						</div>
					</div>
				</div>
				<div class="flex flex-row-reverse bg-surface-700 p-7 py-2"></div>
			</div>
		</div>
	{:else}
		<div class="mx-auto card p-6 py-12">
			<div
				class="w-full flex flex-col lg:divide-x divide-surface-500 lg:flex-row items-center justify-around gap-5 lg:gap-2"
			>
				<div class="flex flex-col items-center justify-center">
					<p class="text-4xl">404</p>
					<p class="text-xl">Clan not found.</p>
				</div>
				<div class="flex flex-col items-center lg:items-start justify-normal lg:ps-20 gap-2">
					<p class="text-lg font-semibold underline underline-offset-2">
						There are a few possible reasons for this:
					</p>
					<ul class="list-disc ms-5">
						<li>They may have deleted the clan</li>
						<li>The clan may be temporarily unavailable due to security or abuse issues</li>
						<li>You may have made a typo!</li>
					</ul>
					<a class="mx-auto mt-10 btn variant-filled-surface" href="/">Back to Home</a>
				</div>
			</div>
		</div>
	{/if}
</div>
