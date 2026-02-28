<script lang="ts">
	import './style.postcss';
	import { appName } from '$lib/env';
	import { __ } from '$lib/language';
	import { userLanguage, userData } from '$lib/storage';
	import { onMount } from 'svelte';
	import { avatarUrl } from '$lib/env';
	import type { DBUser, PlayerCounts } from '$lib/types';
	import { ChevronsUp, ChevronLeft, ChevronRight } from 'svelte-feathers';
	import { env } from '$env/dynamic/public';
	import { fade, fly } from 'svelte/transition';

	export let data: {
		userCounts?: PlayerCounts;
		recentAccounts?: DBUser[];
		rankedMapsCount?: number;
		ppRecords?: Array<{
			mode: number;
			pp: number;
			name: string;
			id: number;
			score_id: number;
		}>;
	};

	let animatedOnline = 0;
	let animatedTotal = 0;
	let currentPPIndex = 0;
	let currentAccountIndex = 0;
	let videoLoaded = false;
	let videoElement: HTMLVideoElement;

	const handleVideoPlay = () => {
		if (videoElement) {
			videoElement.play().catch(() => {
				document.addEventListener(
					'touchstart',
					() => {
						videoElement.play();
					},
					{ once: true }
				);
			});
		}
	};

	const nextPP = () => {
		if (data.ppRecords) {
			currentPPIndex = (currentPPIndex + 1) % data.ppRecords.length;
		}
	};

	const prevPP = () => {
		if (data.ppRecords) {
			currentPPIndex = currentPPIndex === 0 ? data.ppRecords.length - 1 : currentPPIndex - 1;
		}
	};

	const nextAccount = () => {
		if (data.recentAccounts) {
			currentAccountIndex = (currentAccountIndex + 1) % data.recentAccounts.length;
		}
	};

	const prevAccount = () => {
		if (data.recentAccounts) {
			currentAccountIndex =
				currentAccountIndex === 0 ? data.recentAccounts.length - 1 : currentAccountIndex - 1;
		}
	};

	const modeNames: { [key: number]: string } = {
		0: 'vn!std',
		1: 'vn!taiko',
		2: 'vn!catch',
		3: 'vn!mania',
		4: 'rx!std',
		5: 'rx!taiko',
		6: 'rx!catch',
		8: 'ap!std',
		12: 'cheat!std',
		16: 'cheatcheat!std',
		20: 'td!std'
	};

	onMount(() => {
		const animateCounter = (target: number, setter: (val: number) => void) => {
			const duration = 1500;
			const start = 0;
			const startTime = performance.now();

			const updateCounter = (currentTime: number) => {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);
				const currentValue = Math.floor(progress * target);

				setter(currentValue);

				if (progress < 1) {
					requestAnimationFrame(updateCounter);
				}
			};

			requestAnimationFrame(updateCounter);
		};

		if (data.userCounts?.counts) {
			animateCounter(data.userCounts.counts.online, (val) => (animatedOnline = val));
			animateCounter(data.userCounts.counts.total, (val) => (animatedTotal = val));
		}
	});
</script>

<svelte:head>
	<title>{appName} :: home</title>
</svelte:head>

<div class="bg-container">
	<video
		bind:this={videoElement}
		autoplay
		muted
		loop
		playsinline
		preload="auto"
		class="bg-video"
		class:loaded={videoLoaded}
		on:loadeddata={() => (videoLoaded = true)}
		on:canplay={handleVideoPlay}
	>
		<source src="sh.webm" type="video/webm" />
	</video>

	<div class="video-blur-overlay"></div>

	<div class="overlay">
		<div class="container mx-auto px-4 py-12 max-w-7xl relative z-[2]">
			<div class="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6 auto-rows-min">

				<!-- Hero Block -->
				<div class="col-span-1 md:col-span-12 lg:col-span-8 variant-glass-surface rounded-3xl p-8 lg:p-10 flex flex-col justify-center" in:fly={{ y: -30, duration: 800, delay: 100 }}>
					<h2 class="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">{appName}</h2>
					<p class="text-white/80 text-lg max-w-2xl leading-relaxed">
						a rich-feature osu! private server. we serve stable - our custom client - aeris - even
						lazer. as of today; 12-01-2026. refx-stack has become stable!
					</p>
				</div>

				<!-- Auth/Profile Block -->
				<div class="col-span-1 md:col-span-6 lg:col-span-4 variant-glass-surface rounded-3xl p-8 flex flex-col justify-center" in:fly={{ y: -30, duration: 800, delay: 200 }}>
					{#if $userData}
						<div class="flex flex-col space-y-4">
							<a href="/u/{$userData.id}" class="btn variant-filled-primary w-full py-4 text-base font-semibold hover-button rounded-xl">
								{__('View Profile', $userLanguage)}
							</a>
							<a href="/settings" class="btn variant-soft-secondary w-full py-4 text-base font-semibold hover-button rounded-xl">
								{__('Settings', $userLanguage)}
							</a>
						</div>
					{:else}
						<div class="flex flex-col space-y-4">
							<a href="/signup" class="btn variant-filled-primary w-full py-4 text-base font-semibold hover-button rounded-xl">
								{__('Sign Up', $userLanguage)}
							</a>
							<a href="/signin" class="btn variant-soft-secondary w-full py-4 text-base font-semibold hover-button rounded-xl">
								{__('Sign In', $userLanguage)}
							</a>
						</div>
					{/if}
				</div>

				<!-- Stats Horizontal Block -->
				{#if data.userCounts?.counts || data.rankedMapsCount}
				<div class="col-span-1 md:col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6" in:fly={{ x: -30, duration: 800, delay: 300 }}>
					{#if data.userCounts?.counts}
						<div class="variant-glass-surface rounded-3xl p-6 flex flex-col items-center justify-center hover-lift">
							<h3 class="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">{__('Online Users', $userLanguage)}</h3>
							<p class="text-3xl font-black text-primary-400">
								{animatedOnline.toLocaleString()}
							</p>
						</div>
						<div class="variant-glass-surface rounded-3xl p-6 flex flex-col items-center justify-center hover-lift">
							<h3 class="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">{__('Registered', $userLanguage)}</h3>
							<p class="text-3xl font-black text-secondary-400">
								{animatedTotal.toLocaleString()}
							</p>
						</div>
					{/if}
					{#if data.rankedMapsCount}
						<div class="variant-glass-surface rounded-3xl p-6 flex flex-col items-center justify-center hover-lift relative overflow-hidden">
							<h3 class="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">{__('Maps Ranked', $userLanguage)}</h3>
							<p class="text-3xl font-black text-tertiary-400">
								{data.rankedMapsCount.toLocaleString()}
							</p>
							<ChevronsUp class="absolute right-4 bottom-4 pointer-events-none text-tertiary-400/20 w-12 h-12" />
						</div>
					{/if}
				</div>
				{/if}

				<!-- Discord Widget (Tall right column) -->
				<div class="col-span-1 md:col-span-6 lg:col-span-4 lg:row-span-2 variant-glass-surface rounded-3xl p-6 flex flex-col" in:fly={{ x: 30, duration: 800, delay: 400 }}>
					<h2 class="text-lg font-bold text-white mb-4 px-2">{__('Community Server', $userLanguage)}</h2>
					<iframe
						src="https://discord.com/widget?id={env.PUBLIC_DISCORD_SERVER_ID}&theme=dark"
						width="100%"
						height="100%"
						class="min-h-[350px] rounded-xl flex-grow"
						frameborder="0"
						title="disc"
						sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
						style="background-color: transparent;"
					>
					</iframe>
				</div>

				<!-- Lower Content Row (PP Records & Recent Accounts) -->
				{#if data.ppRecords && data.ppRecords.length}
				<div class="col-span-1 md:col-span-6 lg:col-span-4 variant-glass-surface rounded-3xl p-6" in:fly={{ y: 30, duration: 800, delay: 500 }}>
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-lg font-bold text-white">{__('PP Records', $userLanguage)}</h2>
						<div class="flex gap-2">
							<button class="btn btn-sm variant-soft-primary p-2 rounded-lg" on:click={prevPP}>
								<ChevronLeft class="w-4 h-4" />
							</button>
							<button class="btn btn-sm variant-soft-primary p-2 rounded-lg" on:click={nextPP}>
								<ChevronRight class="w-4 h-4" />
							</button>
						</div>
					</div>
					{#if data.ppRecords[currentPPIndex]}
						{@const score = data.ppRecords[currentPPIndex]}
						<div class="flex items-center bg-black/30 rounded-2xl p-4 hover-glow group border border-white/5">
							<img
								src={`${avatarUrl}/${score.id}`}
								alt="{score.name}'s avatar"
								class="w-12 h-12 rounded-full mr-4 object-cover shadow-lg"
							/>
							<div class="flex-grow">
								<a
									href={`/scores/${score.score_id}`}
									class="text-base font-semibold text-white group-hover:text-primary-400 transition-colors block"
								>
									{score.name}
								</a>
								<p class="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">
									{modeNames[score.mode]};
								</p>
							</div>
							<span class="text-secondary-400 font-black text-lg">
								{score.pp.toFixed(0)}<span class="text-sm font-semibold opacity-80">pp</span>
							</span>
						</div>
					{/if}
				</div>
				{/if}

				{#if data.recentAccounts && data.recentAccounts.length}
				<div class="col-span-1 md:col-span-6 lg:col-span-4 variant-glass-surface rounded-3xl p-6" in:fly={{ y: 30, duration: 800, delay: 600 }}>
					<div class="flex justify-between items-center mb-6">
						<h2 class="text-lg font-bold text-white">
							{__('Recent Players', $userLanguage)}
						</h2>
						<div class="flex gap-2">
							<button class="btn btn-sm variant-soft-primary p-2 rounded-lg" on:click={prevAccount}>
								<ChevronLeft class="w-4 h-4" />
							</button>
							<button class="btn btn-sm variant-soft-primary p-2 rounded-lg" on:click={nextAccount}>
								<ChevronRight class="w-4 h-4" />
							</button>
						</div>
					</div>
					{#if data.recentAccounts[currentAccountIndex]}
						{@const account = data.recentAccounts[currentAccountIndex]}
						<div class="flex items-center bg-black/30 rounded-2xl p-4 hover-glow group border border-white/5">
							<img
								src={`${avatarUrl}/${account.id}`}
								alt="{account.name}'s avatar"
								class="w-12 h-12 rounded-full mr-4 object-cover shadow-lg"
							/>
							<div class="flex-grow">
								<a
									href={`/u/${account.id}`}
									class="text-base font-semibold text-white group-hover:text-primary-400 transition-colors block truncate max-w-[160px]"
								>
									{account.name}
								</a>
								<p class="text-xs text-white/50 font-medium tracking-wider mt-1">
									{new Date(account.creation_time * 1000).toLocaleDateString()}
								</p>
							</div>
						</div>
					{/if}
				</div>
				{/if}

			</div>
		</div>
	</div>
</div>
