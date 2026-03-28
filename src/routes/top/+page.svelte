<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { appName } from '$lib/env.js';
	import { parseModsInt } from '$lib/mods';
	import Mod from '$lib/components/Mod.svelte';
	import ChevronLeft from 'svelte-feathers/ChevronLeft.svelte';
	import ChevronRight from 'svelte-feathers/ChevronRight.svelte';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';

	export let data;

	const modes = ['osu', 'taiko', 'catch', 'mania'];
	const types = ['vanilla', 'relax', 'autopilot', 'cheat', 'cheatcheat', 'touch'];

	$: currentPage = data.page;
	$: currentModeNumber = data.mode;

	let currentMode = 'osu';
	let currentType = 'vanilla';

	$: {
		currentMode = 'osu';
		currentType = 'vanilla';

		const m = currentModeNumber % 4;
		if (m === 1) currentMode = 'taiko';
		else if (m === 2) currentMode = 'catch';
		else if (m === 3) currentMode = 'mania';

		if (currentModeNumber >= 4 && currentModeNumber < 8) currentType = 'relax';
		else if (currentModeNumber >= 8 && currentModeNumber < 12) currentType = 'autopilot';
		else if (currentModeNumber === 12) currentType = 'cheat';
		else if (currentModeNumber === 16) currentType = 'cheatcheat';
		else if (currentModeNumber === 20) currentType = 'touch';
	}

	function getModeNumber(mode: string, type: string): number {
		let modeNum = 0;
		switch (mode) {
			case 'taiko':
				modeNum = 1;
				break;
			case 'catch':
				modeNum = 2;
				break;
			case 'mania':
				modeNum = 3;
				break;
		}
		if (type === 'relax') modeNum += 4;
		if (type === 'autopilot') modeNum += 8;
		if (type === 'cheat') modeNum = 12;
		if (type === 'cheatcheat') modeNum = 16;
		if (type === 'touch') modeNum = 20;
		return modeNum;
	}

	function changeMode(newMode: string) {
		const modeNum = getModeNumber(newMode, currentType);
		goto(`/top?mode=${modeNum}&page=1`);
	}

	function changeType(newType: string) {
		if (newType == 'relax' && currentMode == 'mania') currentMode = 'osu';
		if (newType == 'autopilot' && currentMode != 'osu') currentMode = 'osu';
		if (newType == 'touch' && currentMode != 'osu') currentMode = 'osu';
		if (newType == 'cheat' && currentMode != 'osu') currentMode = 'osu';
		if (newType == 'cheatcheat' && currentMode != 'osu') currentMode = 'osu';
		const modeNum = getModeNumber(currentMode, newType);
		goto(`/top?mode=${modeNum}&page=1`);
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
				<div class="w-full flex flex-col md:flex-row justify-center md:justify-start rounded-lg">
					<div class="flex w-full md:hidden mb-1">
						<button
							class="flex-1 !scale-100 btn {currentType == 'vanilla'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-r-none"
							on:click={() => changeType('vanilla')}
						>
							Vanilla
						</button>
						<button
							class="flex-1 !scale-100 btn {currentType == 'relax'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-none"
							on:click={() => changeType('relax')}
							disabled={currentMode == 'mania'}
						>
							Relax
						</button>
						<button
							class="flex-1 !scale-100 btn {currentType == 'autopilot'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-l-none"
							on:click={() => changeType('autopilot')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							Autopilot
						</button>
					</div>

					<div class="flex w-full md:hidden">
						<button
							class="flex-1 !scale-100 btn {currentType == 'touch'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-r-none"
							on:click={() => changeType('touch')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							TouchScreen
						</button>
						<button
							class="flex-1 !scale-100 btn {currentType == 'cheat'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-r-none"
							on:click={() => changeType('cheat')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							Cheat
						</button>
						<button
							class="flex-1 !scale-100 btn {currentType == 'cheatcheat'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-l-none"
							on:click={() => changeType('cheatcheat')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							CheatCheat
						</button>
					</div>

					<div class="hidden md:flex w-full">
						<button
							class="w-[20%] !scale-100 btn {currentType == 'vanilla'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-r-none"
							on:click={() => changeType('vanilla')}
						>
							Vanilla
						</button>
						<button
							class="w-[20%] !scale-100 btn {currentType == 'relax'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-none"
							on:click={() => changeType('relax')}
							disabled={currentMode == 'mania'}
						>
							Relax
						</button>
						<button
							class="w-[20%] !scale-100 btn {currentType == 'autopilot'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-none"
							on:click={() => changeType('autopilot')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							Autopilot
						</button>
						<button
							class="w-[20%] !scale-100 btn {currentType == 'touch'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-none"
							on:click={() => changeType('touch')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							TouchScreen
						</button>
						<button
							class="w-[20%] !scale-100 btn {currentType == 'cheat'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-none"
							on:click={() => changeType('cheat')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							Cheat
						</button>
						<button
							class="w-[20%] !scale-100 btn {currentType == 'cheatcheat'
								? 'bg-surface-500'
								: 'bg-surface-600'} rounded-lg rounded-l-none"
							on:click={() => changeType('cheatcheat')}
							disabled={currentMode == 'taiko' || currentMode == 'catch' || currentMode == 'mania'}
						>
							CheatCheat
						</button>
					</div>
				</div>
				<div class="w-full flex rounded-lg">
					<button
						class="w-[25%] !scale-100 btn {currentMode == 'osu'
							? 'bg-surface-500'
							: 'bg-surface-600'} rounded-lg rounded-r-none"
						on:click={() => changeMode('osu')}
					>
						osu!
					</button>
					<button
						class="w-[25%] !scale-100 btn {currentMode == 'taiko'
							? 'bg-surface-500'
							: 'bg-surface-600'} rounded-none"
						on:click={() => changeMode('taiko')}
					>
						taiko
					</button>
					<button
						class="w-[25%] !scale-100 btn {currentMode == 'catch'
							? 'bg-surface-500'
							: 'bg-surface-600'} rounded-none"
						on:click={() => changeMode('catch')}
					>
						catch
					</button>
					<button
						class="w-[25%] !scale-100 btn {currentMode == 'mania'
							? 'bg-surface-500'
							: 'bg-surface-600'} rounded-lg rounded-l-none"
						on:click={() => changeMode('mania')}
					>
						mania
					</button>
				</div>
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
								<div class="flex flex-row gap-0.5">
									{#each parseModsInt(score.mods, score.mods_json) as mod}
										<Mod {mod} size={16} tooltip={true} showSettings={true} />
									{/each}
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
