<script lang="ts">
	import './style.postcss';
	import { appName, apiUrl, avatarUrl } from '$lib/env';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { scale } from 'svelte/transition';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { ChevronsUp, User } from 'svelte-feathers';

	const drawerStore = getDrawerStore();

	export let data: PageData;
	let currentTime = new Date();

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

	let userSearchResults: { id: number; name: string }[] = [];
	let userSearchQuery = '';
	let userSearchTimeout: any;

	const searchUsers = async () => {
		if (userSearchTimeout) clearTimeout(userSearchTimeout);

		if (userSearchQuery.length <= 2) {
			userSearchResults = [];
			return;
		}

		userSearchTimeout = setTimeout(async () => {
			try {
				const url = `${apiUrl}/v1/search_players?q=${userSearchQuery}&nerv=1`;
				const response = await fetch(url, {
					method: 'GET'
				});
				if (response.ok) {
					const json = await response.json();
					userSearchResults = json.result;
				} else {
					userSearchResults = [];
				}
			} catch {
				userSearchResults = [];
			}
		}, 500);
	};

	$: formattedTime = currentTime.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit'
	});

	const navigateToUser = (userId: number) => {
		goto(`/nerv/u/${userId}`);
	};
</script>

<svelte:head>
	<title>{appName} :: Nerv</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="nerv">
	<div class="welcome-message">
		Welcome aboard, {data.OurUser.name} (#{data.OurUser.id})!
	</div>

	<div class="search-section">
		<div class="search-container">
			<input
				type="text"
				bind:value={userSearchQuery}
				on:input={searchUsers}
				placeholder="Search players..."
				class="search-input"
			/>
			<div class="search-icon">⌕</div>
		</div>

		{#if userSearchResults.length > 0}
			<div class="search-results">
				<div class="overflow-y-auto">
					<div class="flex flex-col gap-2">
						{#each userSearchResults as user}
							<!-- svelte-ignore a11y-click-events-have-key-events -->
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="flex items-center gap-2 p-1 rounded-lg cursor-pointer bg-surface-900 hover:bg-surface-700 transition-all"
								transition:scale={{ start: 0.99, duration: 200 }}
								on:click={() => {
									goto(`/nerv/u/${user.id}`);
									drawerStore.close();
									userSearchQuery = '';
									userSearchResults = [];
								}}
							>
								<img src="{avatarUrl}/{user.id}" alt={user.name} class="w-10 h-10 rounded-lg" />
								<p>{user.name}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="stats-overview">
		<div class="stat-card" style="transform: translateX({Math.random() * 10}px)">
			<User class="pointer-events-none text-red-400" />
			<h3>Player Stats</h3>
			<div class="stat-grid">
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * 8}px)">
					<span class="stat-label">Online</span>
					<span class="stat-value">{data.userCounts?.counts.online}</span>
				</div>
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * -5}px)">
					<span class="stat-label">Registered</span>
					<span class="stat-value">{data.userCounts?.counts.total}</span>
				</div>
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * 6}px)">
					<span class="stat-label">Restricted</span>
					<span class="stat-value">{data.restrictedAccountsCount}</span>
				</div>
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * -4}px)">
					<span class="stat-label">Total PP</span>
					<span class="stat-value">{data.totalPP}</span>
				</div>
			</div>
		</div>

		<div class="stat-card" style="transform: translateX({Math.random() * 10}px)">
			<ChevronsUp class="pointer-events-none text-red-400" />
			<h3>Gameplay Stats</h3>
			<div class="stat-grid">
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * 8}px)">
					<span class="stat-label">Ranked Maps</span>
					<span class="stat-value">{data.rankedMapsCount}</span>
				</div>
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * -5}px)">
					<span class="stat-label">Total Scores</span>
					<span class="stat-value">{data.scoreCount}</span>
				</div>
				<div class="stat-item hoverable" style="transform: translateX({Math.random() * 6}px)">
					<span class="stat-label">Total Plays</span>
					<span class="stat-value">{data.totalPlays}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="recent-accounts">
		<h3>Recent Accounts</h3>
		<div class="accounts-list">
			{#each data.recentAccounts.slice(0, 5) as account}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div class="account-item" on:click={() => navigateToUser(account.id)}>
					<img src={`${avatarUrl}/${account.id}`} alt={account.name} class="user-avatar" />
					<div class="account-info">
						<div class="account-name">{account.name}</div>
						<div class="account-time">
							{new Date(account.creation_time * 1000).toLocaleDateString()}
						</div>
					</div>
					<div class="account-id">#{account.id}</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="time-display">
		<div class="current-time">{formattedTime}</div>
	</div>
</div>
