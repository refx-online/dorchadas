<script lang="ts">
	import type { LBUser } from '$lib/types';
	import { onMount } from 'svelte';
	import ChevronLeft from 'svelte-feathers/ChevronLeft.svelte';
	import ChevronRight from 'svelte-feathers/ChevronRight.svelte';
	import { apiUrl, appName } from '$lib/env';
	import { encodeCategory, normalizeLegacyType } from '$lib/modes';
	import { queryParam } from 'sveltekit-search-params';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import ModeSelector from '$lib/components/ModeSelector.svelte';
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';

	const modes = ['osu', 'taiko', 'catch', 'mania'];
	const types = ['vanilla', 'vanilla-rx', 'vanilla-ap', 'cheat', 'cheat-rx', 'cheat-ap'];
	const sorts = ['pp', 'tscore'];

	let currentLeaderboard: LBUser[] = [];
	const usersPerPage = 50;

	let firstLoad = true;
	let loading = true;
	let failed = false;

	const queryMode = queryParam('mode', undefined, {
		pushHistory: false
	});
	const queryType = queryParam('type', undefined, {
		pushHistory: false
	});
	const querySort = queryParam('sort', undefined, {
		pushHistory: false
	});
	const queryPage = queryParam('page', undefined, {
		pushHistory: false
	});

	let currentType = 'vanilla';
	let currentMode = 'osu';
	let currentSort = 'pp';
	let currentPage = 1;
	let hasNextPage = true;

	const selectedMode = $queryMode;
	const selectedType = $queryType;
	const selectedSort = $querySort;
	if (modes.includes(selectedMode!)) currentMode = selectedMode!;
	if (types.includes(selectedType!)) currentType = selectedType!;
	else currentType = normalizeLegacyType(selectedType);
	if (sorts.includes(selectedSort!)) currentSort = selectedSort!;
	if (/^\d+$/.test($queryPage!) && parseInt($queryPage!) > 0) currentPage = parseInt($queryPage!);

	const refreshLeaderboard = async () => {
		if (loading && !firstLoad) return;
		loading = true;
		currentLeaderboard = [];
		let mode = 0;
		const urlParams = new URLSearchParams();

		if (encodeCategory(currentMode, currentType) === null) currentMode = 'osu';

		queryMode.set(currentMode);
		queryType.set(currentType);
		querySort.set(currentSort);
		queryPage.set(currentPage.toFixed(0));

		mode = encodeCategory(currentMode, currentType) ?? 0;

		urlParams.set('mode', mode.toFixed(0));
		urlParams.set('sort', currentSort);
		urlParams.set('limit', '50');
		urlParams.set('offset', ((currentPage - 1) * usersPerPage).toFixed(0));

		try {
			const leaderboard = await fetch(`${apiUrl}/v1/get_leaderboard?` + urlParams.toString());
			const leaderboardJSON = await leaderboard.json();
			hasNextPage = leaderboardJSON.leaderboard.length >= usersPerPage;
			currentLeaderboard = leaderboardJSON.leaderboard;
			failed = false;
			firstLoad = false;
		} catch {
			failed = true;
		}
		loading = false;
	};

	const onModeSelect = (event: CustomEvent<{ type: string; mode: string }>) => {
		const { type, mode } = event.detail;
		if (currentType == type && currentMode == mode) return;
		currentPage = 1;
		currentType = type;
		currentMode = mode;
		refreshLeaderboard();
	};

	const setSort = (sort: string) => {
		if (currentSort == sort) return;
		currentPage = 1;
		currentSort = sort;
		refreshLeaderboard();
	};

	const nextPage = () => {
		currentPage += 1;
		const pageMain = document.getElementById('page');
		if (pageMain) pageMain.scrollTo({ top: 0, behavior: 'smooth' });
		refreshLeaderboard();
	};

	const prevPage = () => {
		if (currentPage <= 1) return;
		currentPage -= 1;
		const pageMain = document.getElementById('page');
		if (pageMain) pageMain.scrollTo({ top: 0, behavior: 'smooth' });
		refreshLeaderboard();
	};

	onMount(() => {
		refreshLeaderboard();
	});
</script>

<svelte:head>
	<title>{appName} :: Leaderboard</title>
</svelte:head>

<div class="container mx-auto w-full p-5">
	<div class=" flex flex-col justify-center">
		<div class="bg-surface-700 rounded-t-lg">
			<div
				class="bg-surface-700w-full flex flex-wrap md:flex-nowrap justify-center gap-y-1 md:gap-y-0 pt-3 px-3"
			>
				<button
					class="w-[50%] md:w-[100%] !scale-100 btn {currentSort == 'pp'
						? 'bg-surface-500'
						: 'bg-surface-600'} rounded-lg rounded-r-none"
					on:click={() => setSort('pp')}
					disabled={loading || failed}
				>
					{__('Performance', $userLanguage)}
				</button>
				<button
					class="w-[50%] md:w-[100%] !scale-100 btn {currentSort == 'tscore'
						? 'bg-surface-500'
						: 'bg-surface-600'} rounded-lg rounded-l-none md:rounded-none"
					on:click={() => setSort('tscore')}
					disabled={loading || failed}
				>
					{__('Total Score', $userLanguage)}
				</button>
			</div>
			<div class="p-3">
				<ModeSelector
					{currentType}
					{currentMode}
					disabled={loading || failed}
					on:select={onModeSelect}
				/>
			</div>
		</div>
		<div class="bg-surface-800 p-3 pb-0 px-0">
			<div class="w-full flex flex-row justify-between items-center px-2">
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={prevPage}
					disabled={currentPage <= 1 || loading || failed}
				>
					<ChevronLeft class="outline-none border-none" />
				</button>
				<p class="text-slate-400">{__('Page', $userLanguage)} {currentPage}</p>
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={nextPage}
					disabled={loading || failed || !hasNextPage}
				>
					<ChevronRight class="outline-none border-none" />
				</button>
			</div>
			{#if failed}
				<div class="w-full flex flex-col justify-center items-center gap-2">
					<p class="text-slate-400">{__('Failed to load leaderboard.', $userLanguage)}</p>
					<button class="btn variant-filled-surface rounded-lg" on:click={refreshLeaderboard}>
						{__('Refresh', $userLanguage)}
					</button>
				</div>
			{:else}
				<Leaderboard
					leaderboardData={currentLeaderboard}
					page={currentPage}
					{usersPerPage}
					{currentMode}
					{currentType}
					{currentSort}
					{loading}
				/>
			{/if}

			<div class="w-full flex flex-row justify-between items-center px-2 mb-2">
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={prevPage}
					disabled={currentPage <= 1 || loading || failed}
				>
					<ChevronLeft class="outline-none border-none" />
				</button>
				<p class="text-slate-400">{__('Page', $userLanguage)} {currentPage}</p>
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={nextPage}
					disabled={loading || failed || !hasNextPage}
				>
					<ChevronRight class="outline-none border-none" />
				</button>
			</div>
		</div>
		<div class="bg-surface-700 p-2 rounded-b-lg"></div>
	</div>
</div>
