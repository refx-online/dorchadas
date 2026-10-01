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

	const feed = [
		...data.recentScores.map((s: any) => ({
			at: new Date(s.play_time).getTime(),
			kind: 'score',
			label: 'SCORE',
			text: `${s.username} — ${Math.round(s.pp)}pp (mode ${s.mode})`
		})),
		...data.recentAccounts.map((a: any) => ({
			at: a.creation_time * 1000,
			kind: 'register',
			label: 'REGISTER',
			text: `${a.name} joined`
		})),
		...data.recentFlags.map((f: any) => ({
			at: new Date(f.created_at).getTime(),
			kind: 'flag',
			label: 'FLAG',
			text: `${f.username} — ${f.kind} on score ${f.score_id}`
		}))
	]
		.filter((e) => Number.isFinite(e.at))
		.sort((a, b) => b.at - a.at)
		.slice(0, 20);

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

	<div class="flex flex-row items-baseline justify-between flex-wrap gap-2">
		<div>
			<h1 class="!text-3xl">Nerv Operations Console</h1>
			<div class="nv-mincho">特務機関NERV作戦部</div>
		</div>
		<div class="text-right">
			<div class="current-time">{formattedTime}</div>
			<div class="nv-mincho">内部専用 // INTERNAL USE ONLY</div>
		</div>
	</div>

	<div class="panel mt-4">
		<div class="panel-header"><span>System Metrics</span><span class="tag">live</span></div>
		<div class="metrics-grid">
			<div class="metric-cell">
				<div class="m-label">Online</div>
				<div class="m-value">{data.userCounts?.counts.online ?? 0}</div>
			</div>
			<div class="metric-cell">
				<div class="m-label">Registered</div>
				<div class="m-value">{data.userCounts?.counts.total ?? 0}</div>
			</div>
			<div class="metric-cell">
				<div class="m-label">Restricted</div>
				<div class="m-value">{data.restrictedAccountsCount}</div>
			</div>
			<div class="metric-cell {Number(data.flagCount) > 0 ? 'highlight' : ''}">
				<div class="m-label">Open Flags</div>
				<div class="m-value">{data.flagCount}</div>
			</div>
			<div class="metric-cell">
				<div class="m-label">Scores</div>
				<div class="m-value">{data.scoreCount}</div>
			</div>
			<div class="metric-cell">
				<div class="m-label">Plays</div>
				<div class="m-value">{data.totalPlays}</div>
			</div>
			<div class="metric-cell">
				<div class="m-label">Ranked Maps</div>
				<div class="m-value">{data.rankedMapsCount}</div>
			</div>
			<div class="metric-cell">
				<div class="m-label">Total PP</div>
				<div class="m-value">{Math.round(data.totalPP)}</div>
			</div>
		</div>
	</div>

	<div class="panel mt-4">
		<div class="panel-header"><span>Event Log</span><span>{feed.length} events</span></div>
		<div class="event-log">
			<div class="el-body">
				{#each feed as e}
					<div class="ev">
						<span class="ev-time">{new Date(e.at).toLocaleTimeString('en-GB')}</span>
						<span class="ev-type {e.kind}">{e.label}</span>
						<span class="ev-detail">{e.text}</span>
					</div>
				{/each}
				{#if !feed.length}
					<div class="ev"><span class="ev-detail">silence. nothing happened yet.</span></div>
				{/if}
			</div>
		</div>
	</div>

	<div class="panel mt-4">
		<div class="panel-header"><span>Sections</span><span>staff only</span></div>
		<div class="flex flex-wrap gap-2">
			<a class="tag" href="/nerv/flags">⚑ Flags ({data.flagCount})</a>
			<a class="tag" href="/nerv/live">● Live Ops</a>
			<a class="tag" href="/nerv/performance">📈 Performance</a>
			<a class="tag" href="/nerv/beatmaps">🎵 Ranking</a>
		</div>
	</div>

	<div class="recent-accounts mt-4">
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
</div>
