<script lang="ts">
	import './style.postcss';
	import { appName } from '$lib/env';
	import { __ } from '$lib/i18n';
	import { userLanguage, userData } from '$lib/storage';
	import { onMount } from 'svelte';
	import { avatarUrl } from '$lib/env';
	import type { DBUser, PlayerCounts } from '$lib/types';
	import { ChevronsUp, ChevronLeft, ChevronRight } from 'svelte-feathers';
	import { env } from '$env/dynamic/public';
	import { fade, fly, scale } from 'svelte/transition';

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
		<div
			class="container mx-auto px-4 py-8 relative z-[2] min-h-screen flex flex-col items-center justify-center"
		>
			<!-- Minimal Centered Hero -->
			<div
				class="w-full max-w-3xl text-center mb-10"
				in:scale={{ duration: 1000, start: 0.95, delay: 100 }}
			>
				<h1 class="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">{appName}</h1>
				<p
					class="text-lg md:text-xl text-white/80 leading-relaxed"
					in:fly={{ y: 20, duration: 800, delay: 300 }}
				>
					a rich-feature osu! private server. we serve stable - our custom client - aeris - even
					lazer. as of today; 12-01-2026. refx-stack has become stable!
				</p>
			</div>

			<!-- Stats Row -->
			{#if data.userCounts?.counts}
				<div
					class="grid grid-cols-2 gap-6 w-full max-w-2xl mx-auto mb-6"
					in:fly={{ y: 30, duration: 800, delay: 500 }}
				>
					<div class="variant-glass-surface rounded-xl p-6 text-center hover-lift">
						<h3 class="text-lg font-bold text-primary-400 mb-2">{__('Online', $userLanguage)}</h3>
						<p class="text-2xl font-semibold text-white">
							{animatedOnline.toLocaleString()}
						</p>
					</div>
					<div class="variant-glass-surface rounded-xl p-6 text-center hover-lift">
						<h3 class="text-lg font-bold text-secondary-400 mb-2">
							{__('Registered', $userLanguage)}
						</h3>
						<p class="text-2xl font-semibold text-white">
							{animatedTotal.toLocaleString()}
						</p>
					</div>
				</div>
			{/if}

			<!-- Auth Buttons -->
			<div
				class="grid grid-cols-2 gap-6 w-full max-w-2xl mx-auto mb-16"
				in:fly={{ y: 30, duration: 800, delay: 700 }}
			>
				{#if $userData}
					<a
						href="/u/{$userData.id}"
						class="btn bg-surface-500/50 hover:bg-surface-500/70 text-white font-medium py-3 rounded-lg hover-button backdrop-blur-sm border border-white/10"
					>
						{__('Profile', $userLanguage)}
					</a>
					<a
						href="/settings"
						class="btn bg-primary-500/80 hover:bg-primary-500 text-white font-medium py-3 rounded-lg hover-button backdrop-blur-sm shadow-lg"
					>
						{__('Settings', $userLanguage)}
					</a>
				{:else}
					<a
						href="/signup"
						class="btn bg-surface-500/50 hover:bg-surface-500/70 text-white font-medium py-3 rounded-lg hover-button backdrop-blur-sm border border-white/10"
					>
						{__('Register', $userLanguage)}
					</a>
					<a
						href="/signin"
						class="btn bg-primary-400/80 hover:bg-primary-400 text-white font-medium py-3 rounded-lg hover-button backdrop-blur-sm shadow-lg"
					>
						{__('Login', $userLanguage)}
					</a>
				{/if}
			</div>

			<!-- Lower Balanced Section (Discord + Stats stack) -->
			<div
				class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto opacity-90 hover:opacity-100 transition-opacity"
				in:fly={{ y: 40, duration: 1000, delay: 900 }}
			>
				<!-- Discord Widget -->
				<div class="variant-glass-surface rounded-xl p-4 h-full min-h-[300px] flex flex-col">
					<h3 class="text-sm font-semibold text-white/60 mb-3 ml-1">
						{__('Community Server', $userLanguage)}
					</h3>
					<iframe
						src="https://discord.com/widget?id={env.PUBLIC_DISCORD_SERVER_ID}&theme=dark"
						width="100%"
						height="100%"
						class="rounded-lg flex-grow"
						frameborder="0"
						title="disc"
						sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
						style="background-color: transparent;"
					>
					</iframe>
				</div>

				<!-- Stats Stack -->
				<div class="flex flex-col gap-6 h-full justify-between">
					<!-- Ranked Maps -->
					{#if data.rankedMapsCount}
						<div class="variant-glass-surface rounded-xl p-4 flex flex-col justify-center flex-1">
							<div class="flex justify-between items-center">
								<h3 class="text-sm font-semibold text-white/60">
									{__('Maps Ranked', $userLanguage)}
								</h3>
								<ChevronsUp class="text-blue-400/50 w-5 h-5" />
							</div>
							<p class="text-xl font-bold text-tertiary-400 mt-1">
								{data.rankedMapsCount.toLocaleString()}
							</p>
						</div>
					{/if}

					<!-- PP Records Mini -->
					{#if data.ppRecords && data.ppRecords.length}
						<div class="variant-glass-surface rounded-xl p-4 flex flex-col justify-center flex-1">
							<div class="flex justify-between items-center mb-2">
								<h3 class="text-sm font-semibold text-white/60">
									{__('PP Record', $userLanguage)}
								</h3>
								<div class="flex gap-1">
									<button class="btn btn-sm variant-soft-primary p-1 rounded" on:click={prevPP}
										><ChevronLeft class="w-3 h-3" /></button
									>
									<button class="btn btn-sm variant-soft-primary p-1 rounded" on:click={nextPP}
										><ChevronRight class="w-3 h-3" /></button
									>
								</div>
							</div>
							{#if data.ppRecords[currentPPIndex]}
								{@const score = data.ppRecords[currentPPIndex]}
								<div class="flex items-center gap-3">
									<img
										src={`${avatarUrl}/${score.id}`}
										alt="{score.name}'s avatar"
										class="w-8 h-8 rounded-full object-cover"
									/>
									<div class="flex-col overflow-hidden">
										<a
											href={`/scores/${score.score_id}`}
											class="text-sm font-bold text-white hover:text-primary-400 truncate block"
											>{score.name}</a
										>
										<span class="text-xs text-secondary-400 font-bold">{score.pp.toFixed(0)}pp</span
										>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Recent Accounts Mini -->
					{#if data.recentAccounts && data.recentAccounts.length}
						<div class="variant-glass-surface rounded-xl p-4 flex flex-col justify-center flex-1">
							<div class="flex justify-between items-center mb-2">
								<h3 class="text-sm font-semibold text-white/60">
									{__('New Player', $userLanguage)}
								</h3>
								<div class="flex gap-1">
									<button class="btn btn-sm variant-soft-primary p-1 rounded" on:click={prevAccount}
										><ChevronLeft class="w-3 h-3" /></button
									>
									<button class="btn btn-sm variant-soft-primary p-1 rounded" on:click={nextAccount}
										><ChevronRight class="w-3 h-3" /></button
									>
								</div>
							</div>
							{#if data.recentAccounts[currentAccountIndex]}
								{@const account = data.recentAccounts[currentAccountIndex]}
								<div class="flex items-center gap-3">
									<img
										src={`${avatarUrl}/${account.id}`}
										alt="{account.name}'s avatar"
										class="w-8 h-8 rounded-full object-cover"
									/>
									<div class="flex-col overflow-hidden">
										<a
											href={`/u/${account.id}`}
											class="text-sm font-bold text-white hover:text-primary-400 truncate block"
											>{account.name}</a
										>
										<span class="text-xs text-white/40"
											>{new Date(account.creation_time * 1000).toLocaleDateString()}</span
										>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
