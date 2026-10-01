<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { appName } from '$lib/env.js';
	import { decodeCategory, encodeCategory } from '$lib/modes';
	import { parseModsInt } from '$lib/mods';
	import Mod from '$lib/components/Mod.svelte';
	import ModeSelector from '$lib/components/ModeSelector.svelte';
	import ChevronLeft from 'svelte-feathers/ChevronLeft.svelte';
	import ChevronRight from 'svelte-feathers/ChevronRight.svelte';
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';

	export let data;

	const modes = ['osu', 'taiko', 'catch', 'mania'];
	const types = ['vanilla', 'vanilla-rx', 'vanilla-ap', 'cheat', 'cheat-rx', 'cheat-ap'];

	$: currentPage = data.page;
	$: currentModeNumber = data.mode;

	let currentMode = 'osu';
	let currentType = 'vanilla';

	$: {
		currentMode = 'osu';
		currentType = 'vanilla';

		const decoded = decodeCategory(currentModeNumber);
		if (decoded) {
			currentMode = decoded.game;
			currentType = decoded.category;
		}
	}

	function getModeNumber(mode: string, type: string): number {
		return encodeCategory(mode, type) ?? 0;
	}

	function onModeSelect(event: CustomEvent<{ type: string; mode: string }>) {
		const { type, mode } = event.detail;
		goto(`/top?mode=${encodeCategory(mode, type) ?? 0}&page=1`);
	}

	function fetchBeatmapCoverUrl(setId: number) {
		return `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`;
	}
</script>

<svelte:head>
	<title>{appName} :: Top Plays</title>
</svelte:head>

<div class="container mx-auto w-full p-5">
	<div class="flex flex-col justify-center">
		<div class="bg-surface-700 rounded-t-lg">
			<div class="grid md:grid-cols-[auto] gap-2 p-3">
				<ModeSelector {currentType} {currentMode} on:select={onModeSelect} />
			</div>
		</div>

		<div class="bg-surface-800 p-3 pb-0 px-0">
			<div class="w-full flex flex-row justify-between items-center px-2 mb-3">
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={() =>
						goto(`/top?mode=${getModeNumber(currentMode, currentType)}&page=${currentPage - 1}`)}
					disabled={currentPage <= 1}
				>
					<ChevronLeft class="outline-none border-none" />
				</button>
				<p class="text-slate-400">{__('Page', $userLanguage)} {currentPage}</p>
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={() =>
						goto(`/top?mode=${getModeNumber(currentMode, currentType)}&page=${currentPage + 1}`)}
					disabled={currentPage >= data.totalPages}
				>
					<ChevronRight class="outline-none border-none" />
				</button>
			</div>
			<div
				class="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
			>
				{#each data.scores ?? [] as score, index}
					<div
						class="bg-zinc-900 rounded-lg overflow-hidden w-full group hover:-translate-y-1 hover:shadow-xl border border-white/5 hover:border-primary-500/50 transition-all duration-300"
					>
						<div class="relative h-32 bg-gray-500 overflow-hidden">
							{#if fetchBeatmapCoverUrl(score.set_id)}
								<img
									src={fetchBeatmapCoverUrl(score.set_id)}
									alt=""
									class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
								/>
							{/if}
							<div
								class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent"
							>
								<div class="flex justify-between items-center mb-1">
									<span class="text-white font-bold">#{(currentPage - 1) * 50 + index + 1}</span>
									<span class="text-white text-sm">{score.pp.toFixed(2)}pp</span>
								</div>
								<a href="/u/{score.userid}" class="block text-white hover:text-blue-400 text-sm">
									{score.username}
								</a>
							</div>
						</div>

						<div class="p-2">
							<a href="/scores/{score.scoreid}" class="block hover:text-blue-400">
								<div class="text-zinc-200 text-sm truncate">{score.artist} -</div>
								<div class="text-zinc-200 text-sm truncate">{score.title}</div>
								<div class="text-zinc-400 text-xs">[{score.version}]</div>
							</a>
							<div class="flex justify-between items-center mt-2">
								<span
									class="w-10 md:w-8 text-center !text-4xl md:!text-2xl font-bold grade grade-{score.grade.toLowerCase()}"
								>
									{score.grade.replaceAll('XH', 'SS').replaceAll('X', 'SS').replaceAll('SH', 'S')}
								</span>
								<div class="flex flex-row gap-1 items-center">
									<div class="flex flex-row gap-0.5 items-center">
										{#each parseModsInt(score.mods, score.mods_json, score.clock_rate) as mod}
											<Mod {mod} size={16} tooltip={true} showSettings={true} />
										{/each}
									</div>
									{#if score.clock_rate && score.clock_rate !== 1.0 && score.clock_rate !== 1.5}
										<span class="text-xs font-semibold text-gray-400"
											>{score.clock_rate.toFixed(2)}x</span
										>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="w-full flex flex-row justify-between items-center px-2 mb-2">
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={() => {
						const pageMain = document.getElementById('page');
						if (pageMain) pageMain.scrollTo({ top: 0, behavior: 'smooth' });
						goto(`/top?mode=${getModeNumber(currentMode, currentType)}&page=${currentPage - 1}`);
					}}
					disabled={currentPage <= 1}
				>
					<ChevronLeft class="outline-none border-none" />
				</button>
				<p class="text-slate-400">{__('Page', $userLanguage)} {currentPage}</p>
				<button
					class="btn variant-filled-surface rounded-lg"
					on:click={() => {
						const pageMain = document.getElementById('page');
						if (pageMain) pageMain.scrollTo({ top: 0, behavior: 'smooth' });
						goto(`/top?mode=${getModeNumber(currentMode, currentType)}&page=${currentPage + 1}`);
					}}
					disabled={currentPage >= data.totalPages}
				>
					<ChevronRight class="outline-none border-none" />
				</button>
			</div>
		</div>
		<div class="bg-surface-700 p-2 rounded-b-lg"></div>
	</div>
</div>
