<script lang="ts">
	import { 
		appName, 
		appUrl, 
		apiUrl, 
		avatarUrl 
	} from '$lib/env';

	import Download from 'svelte-feathers/Download.svelte';
	import Star from 'svelte-feathers/Star.svelte';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import Mod from '$lib/components/Mod.svelte';
	import { parseModsInt } from '$lib/mods';

	export let data;

	const formatNumber = (num: number) => num.toLocaleString();
	const formatAccuracy = (acc: number) => `${acc.toFixed(2)}%`;

	const getGradeClass = (grade: string) => {
		switch(grade) {
			case 'SSH': case 'SS': return 'text-gray-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse';
			case 'SH': case 'S': return 'text-gray-200 drop-shadow-[0_0_15px_rgba(229,231,235,0.6)]';
			case 'A': return 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]';
			case 'B': return 'text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.4)]';
			case 'C': return 'text-gray-500 drop-shadow-[0_0_6px_rgba(107,114,128,0.3)]';
			case 'D': return 'text-gray-600 drop-shadow-[0_0_4px_rgba(75,85,99,0.2)]';
			default: return 'text-gray-500';
		}
	};

	$: formattedDate = data.score ? new Date(data.score.play_time).toLocaleDateString() : '';
</script>

<svelte:head>
	{#if data.score && data.beatmap}
		<title>{appName} :: {data.player?.name} - {data.beatmap.artist} - {data.beatmap.title} [{data.beatmap.version}] - score info</title>
		<meta property="og:type" content="profile" />
		<meta property="og:title" content="{data.player?.name} - {data.beatmap.artist} - {data.beatmap.title} [{data.beatmap.version}] - score info" />
		<meta property="og:url" content="{appUrl}/scores/{data.score.id}" />
	{:else}
		<title>{appName} :: score not found</title>
	{/if}
</svelte:head>

<div class="container mx-auto w-full p-3 sm:p-5 relative z-0">
	{#if data.score && data.beatmap}
		<div class="mx-auto max-w-6xl relative z-10">
			<div class="relative bg-gray-900 rounded-t-lg overflow-hidden">
				<div class="relative z-10 p-4 sm:p-6">
					<div class="text-xs text-gray-300 mb-1">performance</div>
					<h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
						<a href="/beatmaps/{data.beatmap.id}" class="hover:text-blue-400 transition-colors cursor-pointer break-words">
							{data.beatmap.title} by {data.beatmap.artist}
						</a>
					</h1>
					<div class="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-300">
						<div class="flex items-center gap-2">
							<Star class="text-yellow-400" size={16} />
							<span class="text-yellow-400 font-semibold">{data.beatmap.diff.toFixed(1)}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="break-words">{data.beatmap.version}</span>
							<span class="text-gray-400">mapped by {data.beatmap.creator}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="relative overflow-hidden z-10">
				<div
					class="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-20"
					style="background-image: url('https://assets.ppy.sh/beatmaps/{data.beatmap.set_id}/covers/cover@2x.jpg');"
				></div>
				<div class="relative z-10 p-4 sm:p-6 lg:p-8">
					<div class="flex flex-col items-center gap-6 lg:gap-8">
						<div class="flex flex-col lg:flex-row items-center w-full gap-6 lg:gap-8">
							<div class="flex flex-col items-center gap-4 flex-shrink-0">
								<div class="relative backdrop-blur-sm bg-black/30 rounded-full p-3 sm:p-4 shadow-2xl border border-gray-600/30">
									<div class="absolute inset-0 rounded-full bg-gradient-to-br from-gray-400/10 to-gray-600/10 animate-pulse"></div>
									<svg class="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 transform -rotate-90 relative z-10 drop-shadow-lg" viewBox="0 0 100 100">
										<defs>
											<linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" style="stop-color:#6b7280;stop-opacity:0.3" />
												<stop offset="50%" style="stop-color:#9ca3af;stop-opacity:0.6" />
												<stop offset="100%" style="stop-color:#4b5563;stop-opacity:0.3" />
											</linearGradient>
											<linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
												<stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:0.9" />
												<stop offset="50%" style="stop-color:#d1d5db;stop-opacity:1" />
												<stop offset="100%" style="stop-color:#9ca3af;stop-opacity:0.8" />
											</linearGradient>
											<filter id="glow">
												<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
												<feMerge> 
													<feMergeNode in="coloredBlur"/>
													<feMergeNode in="SourceGraphic"/>
												</feMerge>
											</filter>
										</defs>
										<circle cx="50" cy="50" r="45" fill="none" stroke="url(#ringGradient)" stroke-width="2" opacity="0.5"/>
										<circle 
											cx="50" 
											cy="50" 
											r="45" 
											fill="none" 
											stroke="url(#progressGradient)" 
											stroke-width="3"
											stroke-dasharray="{2 * Math.PI * 45}"
											stroke-dashoffset="{2 * Math.PI * 45 * (1 - data.score.acc / 100)}"
											stroke-linecap="round"
											filter="url(#glow)"
											class="animate-pulse"
										/>
										<circle cx="50" cy="50" r="35" fill="none" stroke="url(#ringGradient)" stroke-width="1.5" opacity="0.3"/>
									</svg>
									<div class="absolute inset-0 flex items-center justify-center">
										<div class="relative">
											<span class="text-4xl sm:text-5xl lg:text-6xl font-bold {getGradeClass(data.score.grade)} relative z-10 tracking-wider transform hover:scale-110 transition-transform duration-300">
												{data.score.grade.replace('H', '')}
											</span>
											<div class="absolute inset-0 text-4xl sm:text-5xl lg:text-6xl font-bold text-white/20 blur-sm -z-10">
												{data.score.grade.replace('H', '')}
											</div>
										</div>
									</div>
								</div>

								{#if data.score.mods > 0}
									<div class="flex flex-wrap justify-center gap-1 sm:gap-2 backdrop-blur-sm bg-black/30 rounded-lg p-2 sm:p-3 border border-gray-600/20 shadow-lg">
										{#each parseModsInt(data.score.mods, data.score.mods_json) as mod}
											<div class="transform hover:scale-105 transition-transform duration-200">
												<Mod {mod} size={22} tooltip={true} showSettings={true}></Mod>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<div class="flex-1 text-center lg:text-left w-full min-w-0">
								<div class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-3 sm:mb-4 break-all">
									{formatNumber(data.score.score)}
								</div>
								<div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 text-base sm:text-lg">
									<div class="flex flex-wrap items-center justify-center gap-2">
										<span class="text-gray-300">Played by</span>
										<a href="/u/{data.score.userid}" class="text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer break-all">
											{data.player?.name}
										</a>
									</div>
									<div class="text-gray-400 text-sm sm:text-base text-center">
										Submitted on {formattedDate}
									</div>
								</div>
							</div>
						</div>

						<div class="w-full backdrop-blur-sm bg-black/30 rounded-lg p-4 sm:p-6 lg:absolute lg:right-0 lg:top-0 lg:w-auto lg:mt-16 border border-gray-600/20 shadow-2xl">
							<div class="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-center mb-4 sm:mb-6">
								<div class="transform hover:scale-105 transition-transform duration-200">
									<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Accuracy</div>
									<div class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-200 drop-shadow-lg">{formatAccuracy(data.score.acc)}</div>
								</div>
								<div class="transform hover:scale-105 transition-transform duration-200">
									<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Max Combo</div>
									<div class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-300 drop-shadow-lg">{formatNumber(data.score.max_combo)}x</div>
								</div>
								<div class="transform hover:scale-105 transition-transform duration-200">
									<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">PP</div>
									<div class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-100 drop-shadow-lg">{Math.round(data.score.pp)}</div>
								</div>
							</div>

							<div class="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 text-center">
								<div class="transform hover:scale-105 transition-transform duration-200">
									<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Ok</div>
									<div class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-300 drop-shadow-md">{formatNumber(data.score.n100)}</div>
								</div>
								<div class="transform hover:scale-105 transition-transform duration-200">
									<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Meh</div>
									<div class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-400 drop-shadow-md">{formatNumber(data.score.n50)}</div>
								</div>
								<div class="transform hover:scale-105 transition-transform duration-200">
									<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Miss</div>
									<div class="text-lg sm:text-xl lg:text-2xl font-bold text-gray-500 drop-shadow-md">{formatNumber(data.score.nmiss)}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="relative bg-gray-700 rounded-b-lg overflow-hidden">
				<div class="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div class="flex items-center gap-3 sm:gap-4">
						<div class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
							<img 
								src="{avatarUrl}/{data.score.userid}" 
								alt="{data.player?.name} avatar"
								class="w-full h-full object-cover"
							/>
						</div>
						<div>
							<a href="/u/{data.score.userid}" class="text-white font-semibold text-base sm:text-lg hover:text-blue-400 transition-colors cursor-pointer break-all"> {data.clan} {data.player?.name}</a>
						</div>
					</div>
					<div class="flex gap-3 w-full sm:w-auto">
						<a 
							href="{apiUrl}/v1/get_play?id={data.score.id}" 
							class="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 flex-1 sm:flex-initial"
						>
							<Download size={16} />
							<span class="hidden sm:inline">Download Replay</span>
							<span class="sm:hidden">Replay</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mx-auto card p-4 sm:p-6 py-8 sm:py-12 max-w-4xl">
			<div class="w-full flex flex-col lg:divide-x divide-surface-500 lg:flex-row items-center justify-around gap-5 lg:gap-2">
				<div class="flex flex-col items-center justify-center">
					<p class="text-3xl sm:text-4xl">404</p>
					<p class="text-lg sm:text-xl text-center">{__('Score not found.', $userLanguage)}</p>
				</div>
				<div class="flex flex-col items-center lg:items-start justify-normal lg:ps-20 gap-2 w-full lg:w-auto">
					<p class="text-base sm:text-lg font-semibold underline underline-offset-2 text-center lg:text-left">
						{__('There are a few possible reasons for this:', $userLanguage)}
					</p>
					<ul class="list-disc ms-5 text-sm sm:text-base">
						<li>{__('The score was deleted', $userLanguage)}</li>
						<li>{__('The score ID is invalid', $userLanguage)}</li>
						<li>{__('You may have made a typo!', $userLanguage)}</li>
					</ul>
					<a class="mx-auto mt-6 sm:mt-10 btn variant-filled-surface text-sm sm:text-base px-4 sm:px-6 py-2" href="/">
						{__('Back to Home', $userLanguage)}
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>