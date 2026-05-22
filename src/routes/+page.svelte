<script lang="ts">
	import './style.postcss';
	import { appName } from '$lib/env';
	import { __ } from '$lib/i18n';
	import { userLanguage, userData } from '$lib/storage';
	import { onMount } from 'svelte';
	import { avatarUrl } from '$lib/env';
	import type { DBUser, PlayerCounts } from '$lib/types';
	import { ChevronsUp, ChevronLeft, ChevronRight, Zap, Award, Users, Music } from 'svelte-feathers';
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
	<div class="home-hud" aria-hidden="true"></div>

	<div class="overlay">
		<section class="hero-shell">
			<svg class="deco-line deco-line-1" viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true">
				<path
					d="M -50 200 Q 200 100 400 300 T 850 250"
					fill="none"
					stroke="url(#gradLine1)"
					stroke-width="1.2"
				/>
				<defs>
					<linearGradient id="gradLine1" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stop-color="rgba(255,255,255,0)" />
						<stop offset="50%" stop-color="rgba(255,255,255,0.35)" />
						<stop offset="100%" stop-color="rgba(255,255,255,0)" />
					</linearGradient>
				</defs>
			</svg>
			<svg class="deco-line deco-line-2" viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true">
				<circle cx="650" cy="500" r="380" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3 8" />
				<circle cx="650" cy="500" r="240" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
			</svg>

			<div class="watermark watermark-top" aria-hidden="true">refx</div>

			<div class="hero-grid">
				<div class="hero-copy-col" in:fly={{ y: 20, duration: 800, delay: 100 }}>
					<h1 class="hero-title-xxl">
						<span class="hero-title-accent">{appName}.</span>
					</h1>
					<p class="hero-subcopy">
						{__('A feature-rich osu! server. Stable client and Custom client.', $userLanguage)}
					</p>

					<div class="hero-cta-row">
						{#if $userData}
							<a href="/u/{$userData.id}" class="cta cta-primary">
								<span>{__('Profile', $userLanguage)}</span>
								<span class="cta-arrow">→</span>
							</a>
							<a href="/settings" class="cta cta-ghost">
								{__('Settings', $userLanguage)}
							</a>
						{:else}
							<a href="/signup" class="cta cta-primary">
								<span>{__('Register', $userLanguage)}</span>
								<span class="cta-arrow">→</span>
							</a>
							<a href="/signin" class="cta cta-ghost">
								{__('Login', $userLanguage)}
							</a>
						{/if}
					</div>

					{#if data.userCounts?.counts}
						<div class="hero-stats-inline" in:fade={{ duration: 700, delay: 600 }}>
							<div class="stat-pill">
								<span class="stat-pill-dot online"></span>
								<span class="stat-pill-num">{animatedOnline.toLocaleString()}</span>
								<span class="stat-pill-label">{__('Online', $userLanguage)}</span>
							</div>
							<div class="stat-pill">
								<span class="stat-pill-num">{animatedTotal.toLocaleString()}</span>
								<span class="stat-pill-label">{__('Registered', $userLanguage)}</span>
							</div>
							{#if data.rankedMapsCount}
								<div class="stat-pill">
									<span class="stat-pill-num">{data.rankedMapsCount.toLocaleString()}</span>
									<span class="stat-pill-label">{__('Maps Ranked', $userLanguage)}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div class="hero-visual-col" in:fly={{ x: 30, duration: 900, delay: 300 }}>
					<div class="float-stack">
						{#if data.ppRecords && data.ppRecords.length}
							{@const score = data.ppRecords[currentPPIndex]}
							<div class="float-card float-card-pp">
								<div class="float-card-head">
									<div class="float-card-tag">
										<Zap class="w-3 h-3" />
										<span>{__('PP Record', $userLanguage)}</span>
									</div>
									<div class="float-card-nav">
										<button class="nav-btn" on:click={prevPP} aria-label="Previous">
											<ChevronLeft class="w-3 h-3" />
										</button>
										<button class="nav-btn" on:click={nextPP} aria-label="Next">
											<ChevronRight class="w-3 h-3" />
										</button>
									</div>
								</div>
								{#if score}
									<div class="float-card-body">
										<img
											src={`${avatarUrl}/${score.id}`}
											alt={score.name}
											class="pp-avatar"
										/>
										<div class="pp-meta">
											<a href={`/scores/${score.score_id}`} class="pp-name">{score.name}</a>
											<span class="pp-mode">{modeNames[score.mode] ?? '—'}</span>
										</div>
										<div class="pp-value">
											<span class="pp-num">{score.pp.toFixed(0)}</span>
											<span class="pp-unit">pp</span>
										</div>
									</div>
								{/if}
							</div>
						{/if}

						<div class="saturn-ring saturn-ring-back" aria-hidden="true"></div>
						<div class="orb-core" aria-hidden="true">
							<div class="orb-ring orb-ring-1"></div>
							<div class="orb-ring orb-ring-2"></div>
							<div class="orb-glyph"> </div>
						</div>
						<div class="saturn-ring saturn-ring-front" aria-hidden="true"></div>

						{#if data.recentAccounts && data.recentAccounts.length}
							{@const account = data.recentAccounts[currentAccountIndex]}
							<div class="float-card float-card-new">
								<div class="float-card-head">
									<div class="float-card-tag">
										<Users class="w-3 h-3" />
										<span>{__('New Player', $userLanguage)}</span>
									</div>
									<div class="float-card-nav">
										<button class="nav-btn" on:click={prevAccount} aria-label="Previous">
											<ChevronLeft class="w-3 h-3" />
										</button>
										<button class="nav-btn" on:click={nextAccount} aria-label="Next">
											<ChevronRight class="w-3 h-3" />
										</button>
									</div>
								</div>
								{#if account}
									<div class="float-card-body">
										<img
											src={`${avatarUrl}/${account.id}`}
											alt={account.name}
											class="pp-avatar"
										/>
										<div class="pp-meta">
											<a href={`/u/${account.id}`} class="pp-name">{account.name}</a>
											<span class="pp-mode">
												{new Date(account.creation_time * 1000).toLocaleDateString()}
											</span>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<section class="band-shell">
			<svg class="deco-line deco-line-band" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
				<path
					d="M 0 100 Q 300 30 600 100 T 1200 100"
					fill="none"
					stroke="rgba(255,255,255,0.1)"
					stroke-width="1"
				/>
			</svg>

			<h2 class="band-title">
				{__('What it looks like', $userLanguage)}
			</h2>

			<div class="feature-row">
				<div class="feature-card" in:fly={{ y: 30, duration: 700, delay: 100 }}>
					<div class="feature-icon">
						<Zap />
					</div>
					<h3 class="feature-title">{__('Our custom client', $userLanguage)}</h3>
					<p class="feature-desc">
						{__('Custom-built client with many cheat features.', $userLanguage)}
					</p>
				</div>
				<div class="feature-card feature-card-offset" in:fly={{ y: 30, duration: 700, delay: 200 }}>
					<div class="feature-icon">
						<Award />
					</div>
					<h3 class="feature-title">{__('Stable', $userLanguage)}</h3>
					<p class="feature-desc">
						{__('Fully support with score submission, leaderboards, and PP recalc.', $userLanguage)}
					</p>
				</div>
				<div class="feature-card" in:fly={{ y: 30, duration: 700, delay: 300 }}>
					<div class="feature-icon">
						<Music />
					</div>
					<h3 class="feature-title">{__('All modes', $userLanguage)}</h3>
					<p class="feature-desc">
						{__('Vanilla, Relax, Autopilot - every mode tracked, ranked, and recalculated.', $userLanguage)}
					</p>
				</div>
			</div>

			<div class="band-watermark" aria-hidden="true">{appName}</div>
		</section>

		<section class="community-shell">
			<div class="community-grid">
				<div class="community-copy-col" in:fly={{ y: 30, duration: 700, delay: 100 }}>
					<div class="hero-eyebrow">
						<span class="eyebrow-dot"></span>
						<span>{__('Community', $userLanguage)}</span>
					</div>
					<h2 class="community-title">
						{__('Drop into the', $userLanguage)}<br />
						<span class="band-title-accent">{__('Discord.', $userLanguage)}</span>
					</h2>
					<p class="community-copy">
						{__('Patch notes, scorepost, and the occasional argument over which mod is broken.', $userLanguage)}
					</p>
					<a href={env.PUBLIC_DISCORD_SERVER_URL} target="_blank" rel="noopener noreferrer" class="cta cta-primary">
						<span>{__('Join Discord', $userLanguage)}</span>
						<span class="cta-arrow">→</span>
					</a>
				</div>
				<div class="community-widget-col" in:fly={{ y: 30, duration: 700, delay: 250 }}>
					<div class="widget-frame">
						<iframe
							src="https://discord.com/widget?id={env.PUBLIC_DISCORD_SERVER_ID}&theme=dark"
							width="100%"
							height="420"
							class="widget-iframe"
							frameborder="0"
							title="discord"
							sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
						></iframe>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
