<script lang="ts">
	import type { PlayerStatus } from '$lib/types';
	import { onMount } from 'svelte';
	import { getPlayerStatus } from '$lib/api.js';
	import { avatarUrl, appName } from '$lib/env.js';
	import { __ } from '$lib/language.js';
	import { userLanguage } from '$lib/storage.js';
	import { getCountryName } from '$lib/country.js';
	import Popup from '$lib/components/Popup.svelte';
	import { User, UserPlus, Users } from 'svelte-feathers';
	import Time, { dayjs } from 'svelte-time';

	export let data;

	let playerStatusMap: Record<number, PlayerStatus['player_status']> = {};
	let activeTab: 'friends' | 'followers' = 'friends';

	function t(timestamp?: number): number {
		if (!timestamp || timestamp === 0) return Date.now();

		const now = Date.now();
		if (timestamp < now / 1000) {
			return timestamp * 1000;
		}

		return timestamp;
	}

	onMount(async () => {
		const statusPromises = [
			...data.friends.map((friend) => getPlayerStatus(friend.id)),
			...data.followers.map((follower) => getPlayerStatus(follower.id))
		];

		const statuses = await Promise.all(statusPromises);

		statuses.forEach((status, index) => {
			if (status) {
				const user =
					index < data.friends.length
						? data.friends[index]
						: data.followers[index - data.friends.length];

				playerStatusMap[user.id] = status.player_status;
			}
		});
	});

	function getOnlineStatus(userId: number) {
		return playerStatusMap[userId]?.online
			? {
					circlething: 'bg-green-500 border-green-600',
					text: __('Online', $userLanguage)
				}
			: {
					circlething: 'bg-gray-400 border-surface-400',
					text: __('Offline', $userLanguage)
				};
	}
</script>

<svelte:head>
	<title>{appName} :: Connections</title>
</svelte:head>

<div class="container mx-auto w-full p-5">
	<div class="mx-auto card">
		<div class="bg-surface-800 p-4 sm:p-7">
			<div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
				<button
					class="btn w-full sm:w-auto {activeTab === 'friends'
						? 'variant-filled-primary'
						: 'variant-soft'} flex items-center justify-center gap-2"
					on:click={() => (activeTab = 'friends')}
				>
					<Users class="w-5 h-5" />
					<span class="whitespace-nowrap">{data.friends.length} {__('Friends', $userLanguage)}</span
					>
				</button>
				<button
					class="btn w-full sm:w-auto {activeTab === 'followers'
						? 'variant-filled-primary'
						: 'variant-soft'} flex items-center justify-center gap-2"
					on:click={() => (activeTab = 'followers')}
				>
					<UserPlus class="w-5 h-5" />
					<span class="whitespace-nowrap"
						>{data.followers.length} {__('Followers', $userLanguage)}</span
					>
				</button>
			</div>

			<!-- Friends -->
			{#if activeTab === 'friends'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each data.friends as friend (friend.id)}
						<div
							class="relative flex flex-col justify-end p-4 h-40 rounded-lg overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-primary-500"
							style="background-image: url('/u/{friend.id}/cover');
                                background-size: cover;
                                background-position: center;"
						>
							<div class="absolute inset-0 bg-black opacity-50"></div>

							<div class="relative z-10 flex items-center">
								<div class="relative mr-4">
									<span
										class="block w-14 h-14 bg-no-repeat bg-center bg-cover rounded-xl shadow-lg"
										style="background-image: url('{avatarUrl}/{friend.id}');"
									></span>
								</div>

								<div class="flex-grow">
									{#if !playerStatusMap[friend.id]?.online && playerStatusMap[friend.id]?.last_seen}
										<div class="text-xs text-surface-300 mb-1">
											<Time
												timestamp={dayjs(t(playerStatusMap[friend.id]?.last_seen)).locale(
													$userLanguage
												)}
												relative
											/>
										</div>
									{/if}

									<div class="flex items-center gap-2 mb-1">
										<div
											class="w-3 h-3 rounded-full border-2 {getOnlineStatus(friend.id).circlething}"
										></div>
										<span class="text-sm text-white">
											{getOnlineStatus(friend.id).text}
										</span>
									</div>

									<div class="flex items-center gap-2">
										<h3 class="text-base font-semibold text-white">{friend.username}</h3>
										<Popup placement="top">
											<img
												class="min-w-4 w-4"
												src="/flags/{friend.country?.toUpperCase() ?? 'XX'}.png"
												alt="country flag"
											/>
											<svelte:fragment slot="popup">
												<div class="card p-2 px-4 rounded-lg variant-filled-surface text-sm">
													{getCountryName(friend.country)}
													<div
														class="arrow border-r border-b border-gray-700 variant-filled-surface"
													></div>
												</div>
											</svelte:fragment>
										</Popup>
									</div>
								</div>

								<!-- TODO: relationship button like on user profile? -->
								<div class="ml-auto">
									<a
										href="/u/{friend.id}"
										class="btn btn-sm variant-soft-primary flex items-center gap-2"
									>
										<User class="w-4 h-4" />
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>

				{#if data.friends.length === 0}
					<div class="text-center text-surface-400 py-10">
						{__('No friends found', $userLanguage)}
					</div>
				{/if}
			{/if}

			<!-- Followers\ -->
			{#if activeTab === 'followers'}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each data.followers as follower (follower.id)}
						<div
							class="relative flex flex-col justify-end p-4 h-40 rounded-lg overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-primary-500"
							style="background-image: url('/u/{follower.id}/cover');
                                background-size: cover;
                                background-position: center;"
						>
							<div class="absolute inset-0 bg-black opacity-50"></div>

							<div class="relative z-10 flex items-center">
								<div class="relative mr-4">
									<span
										class="block w-14 h-14 bg-no-repeat bg-center bg-cover rounded-xl shadow-lg"
										style="background-image: url('{avatarUrl}/{follower.id}');"
									></span>
								</div>

								<div class="flex-grow">
									{#if !playerStatusMap[follower.id]?.online && playerStatusMap[follower.id]?.last_seen}
										<div class="text-xs text-surface-300 mb-1">
											<Time
												timestamp={dayjs(t(playerStatusMap[follower.id]?.last_seen)).locale(
													$userLanguage
												)}
												relative
											/>
										</div>
									{/if}

									<div class="flex items-center gap-2 mb-1">
										<div
											class="w-3 h-3 rounded-full border-2 {getOnlineStatus(follower.id)
												.circlething}"
										></div>
										<span class="text-sm text-white">
											{getOnlineStatus(follower.id).text}
										</span>
									</div>

									<div class="flex items-center gap-2">
										<h3 class="text-base font-semibold text-white">{follower.username}</h3>
										<Popup placement="top">
											<img
												class="min-w-4 w-4"
												src="/flags/{follower.country?.toUpperCase() ?? 'XX'}.png"
												alt="country flag"
											/>
											<svelte:fragment slot="popup">
												<div class="card p-2 px-4 rounded-lg variant-filled-surface text-sm">
													{getCountryName(follower.country)}
													<div
														class="arrow border-r border-b border-gray-700 variant-filled-surface"
													></div>
												</div>
											</svelte:fragment>
										</Popup>
									</div>
								</div>

								<div class="ml-auto">
									<a
										href="/u/{follower.id}"
										class="btn btn-sm variant-soft-primary flex items-center gap-2"
									>
										<User class="w-4 h-4" />
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>

				{#if data.followers.length === 0}
					<div class="text-center text-surface-400 py-10">
						{__('No followers found', $userLanguage)}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
