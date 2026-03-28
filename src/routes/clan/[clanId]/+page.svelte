<script lang="ts">
	import { appName, appUrl, avatarUrl } from '$lib/env';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import Frown from 'svelte-feathers/Frown.svelte';
	import type { Clan } from '$lib/types';

	import { invalidateAll } from '$app/navigation';
	export let data: {
		clan: Clan;
		isOwner: boolean;
		isMember: boolean;
		isOfficer: boolean;
		hasPendingRequest: boolean;
		currentUser: any;
		csrfToken: string;
	};

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
				const result = await response.json();
				alert(result.message || __('An error occurred while leaving the clan', $userLanguage));
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

	async function performAction(endpoint: string, targetUserId: number, confirmMsg: string) {
		if (!confirm(confirmMsg)) return;
		isLoading = true;
		try {
			const response = await fetch(`/clan/${data.clan.id}/settings/members/${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetUserId })
			});
			if (response.ok) {
				invalidateAll();
			} else {
				const result = await response.json();
				alert(result.message || __('An error occurred', $userLanguage));
			}
		} catch {
			alert(__('An error occurred', $userLanguage));
		} finally {
			isLoading = false;
		}
	}

	function handleKick(userId: number, userName: string) {
		performAction(
			'kick',
			userId,
			`${__('Are you sure you want to kick', $userLanguage)} ${userName}?`
		);
	}

	function handlePromote(userId: number, userName: string) {
		performAction(
			'promote',
			userId,
			`${__('Are you sure you want to promote', $userLanguage)} ${userName} ${__('to officer?', $userLanguage)}`
		);
	}

	function handleDemote(userId: number, userName: string) {
		performAction(
			'demote',
			userId,
			`${__('Are you sure you want to demote', $userLanguage)} ${userName} ${__('to member?', $userLanguage)}`
		);
	}

	function handleTransfer(userId: number, userName: string) {
		performAction(
			'transfer',
			userId,
			`${__('Are you sure you want to transfer ownership to', $userLanguage)} ${userName}? ${__('You will become an officer.', $userLanguage)}`
		);
	}

	const handleImageError = (e: Event) => {
		const target = e.currentTarget;
		if (target instanceof HTMLImageElement) {
			target.style.display = 'none';
			const next = target.nextElementSibling;
			if (next && next instanceof HTMLElement) {
				next.style.display = 'inline-block';
			}
		}
	};
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
		{@const memberCount = data.clan.members.filter((member) => member.id != owner.id).length}
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
									on:error={handleImageError}
								/>
								<p class="chip cursor-auto variant-filled-primary" style="display: none;">
									{data.clan.tag}
								</p>
							</div>
							{data.clan.name}
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if data.isOfficer}
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
							class="mx-auto {memberCount <= 0
								? 'flex flex-col justify-center items-center'
								: 'grid grid-cols-2'} gap-2"
						>
							{#if memberCount <= 0}
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
											{#if member.clan_priv === 2}
												<span class="chip variant-soft-secondary"
													>{__('Officer', $userLanguage)}</span
												>
											{/if}

											<div class="ms-auto flex gap-2">
												{#if data.isOfficer && data.currentUser}
													{#if data.isOwner}
														{#if member.clan_priv === 1}
															<button
																class="btn btn-sm variant-filled-secondary"
																on:click={() => handlePromote(member.id, member.name)}
																disabled={isLoading}
															>
																{__('Promote', $userLanguage)}
															</button>
														{:else if member.clan_priv === 2}
															<button
																class="btn btn-sm variant-filled-warning"
																on:click={() => handleDemote(member.id, member.name)}
																disabled={isLoading}
															>
																{__('Demote', $userLanguage)}
															</button>
														{/if}
														<button
															class="btn btn-sm variant-filled-primary"
															on:click={() => handleTransfer(member.id, member.name)}
															disabled={isLoading}
														>
															{__('Transfer', $userLanguage)}
														</button>
														<button
															class="btn btn-sm variant-filled-error"
															on:click={() => handleKick(member.id, member.name)}
															disabled={isLoading}
														>
															{__('Kick', $userLanguage)}
														</button>
													{:else if data.currentUser.clanPriv === 2 && member.clan_priv === 1}
														<button
															class="btn btn-sm variant-filled-secondary"
															on:click={() => handlePromote(member.id, member.name)}
															disabled={isLoading}
														>
															{__('Promote', $userLanguage)}
														</button>
														<button
															class="btn btn-sm variant-filled-error"
															on:click={() => handleKick(member.id, member.name)}
															disabled={isLoading}
														>
															{__('Kick', $userLanguage)}
														</button>
													{/if}
												{/if}
											</div>
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
