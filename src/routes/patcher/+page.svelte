<script>
	import './style.postcss';
	import { onMount } from 'svelte';
	import { appName } from '$lib/env';
	import { fade, scale } from 'svelte/transition';
	import { X } from 'svelte-feathers';

	import {
		Download,
		Coffee,
		Code,
		Layout,
		Shield,
		CheckCircle,
		Monitor,
		Settings,
		FastForward,
		GitBranch,
		Star
	} from 'svelte-feathers';

	let mounted = false;
	let lightboxOpen = false;
	let currentScreenshot = null;
	let touchStartX = 0;
	let touchEndX = 0;

	const screenshots = [
		{
			id: 1,
			src: '/patcher/screenshot-1.jpg',
			alt: 'g'
		},
		{
			id: 2,
			src: '/patcher/screenshot-2.png',
			alt: 'a'
		},
		{
			id: 3,
			src: '/patcher/screenshot-3.jpg',
			alt: 'rl'
		}
	];

	const downloadInfo = {
		url: 'https://github.com/refx-online/patcher-cli/releases/'
	};

	const features = [
		{
			text: "Enable Relax/Autopilot Miss (wow! who would've thought)",
			icon: CheckCircle
		},
		{
			text: 'Enable Relax/Autopilot Combo Miss Sound (the sound!)',
			icon: Monitor
		},
		{
			text: 'Show Relax/Autopilot Ranking Panel',
			icon: Layout
		},
		{
			text: 'Faster Transition',
			icon: FastForward
		},
		{
			text: 'This fuckshit is not for the cheat leaderboard!',
			icon: GitBranch
		},
		{
			text: 'Totally not a crypto miner!',
			icon: Settings
		},
		{
			text: 'And more in the future!',
			icon: Star
		}
	];

	function openLightbox(screenshot) {
		currentScreenshot = screenshot;
		lightboxOpen = true;
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		lightboxOpen = false;
		document.body.style.overflow = '';
	}

	function handleKeydown(event) {
		if (lightboxOpen) {
			if (event.key === 'Escape') {
				closeLightbox();
			} else if (event.key === 'ArrowLeft') {
				navigateScreenshot(-1);
			} else if (event.key === 'ArrowRight') {
				navigateScreenshot(1);
			}
		}
	}

	function navigateScreenshot(direction) {
		if (!currentScreenshot) return;

		const currentIndex = screenshots.findIndex((s) => s.id === currentScreenshot.id);
		let newIndex = currentIndex + direction;

		if (newIndex < 0) newIndex = screenshots.length - 1;
		if (newIndex >= screenshots.length) newIndex = 0;

		currentScreenshot = screenshots[newIndex];
	}

	function handleTouchStart(event) {
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchMove(event) {
		touchEndX = event.touches[0].clientX;
	}

	function handleTouchEnd() {
		if (lightboxOpen) {
			const swipeDistance = touchEndX - touchStartX;
			if (Math.abs(swipeDistance) > 50) {
				if (swipeDistance > 0) {
					navigateScreenshot(-1);
				} else {
					navigateScreenshot(1);
				}
			}
		}
	}

	onMount(() => {
		mounted = true;
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:head>
	<title>{appName} :: Patcher</title>
</svelte:head>

<div class="patcher-container min-h-screen relative z-[1] overflow-hidden">
	{#if mounted}
		<div class="absolute inset-0 opacity-10 blur-3xl z-[0]">
			<div class="absolute w-80 h-80 bg-purple-500/30 rounded-full -top-10 -left-10"></div>
			<div class="absolute w-96 h-96 bg-indigo-500/30 rounded-full -bottom-20 -right-20"></div>
		</div>
	{/if}

	<div class="container mx-auto px-4 py-16 relative z-[2]">
		<header class="text-center mb-16">
			<div class="flex justify-center mb-4">
				<div class="icon-wrapper">
					<Code size="36" color="#8b5cf6" />
				</div>
			</div>
			<h1 class="text-5xl font-bold mb-3 text-white">re;fx Patcher</h1>
		</header>

		<section class="description mb-20 text-center mx-auto">
			<div class="flex items-center justify-center mb-6">
				<Coffee class="mr-3 text-purple-500" size="24" />
				<h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">About</h2>
			</div>
			<p class="text-lg max-w-3xl mx-auto text-gray-300">
				re;fx Patcher is an osu! patcher designed to enhance the relax experience with features that
				osu! should already have included.
			</p>
		</section>

		<section class="screenshots mb-20">
			<div class="screenshot-grid">
				{#each screenshots as screenshot}
					<div
						class="screenshot-card"
						on:click={() => openLightbox(screenshot)}
						on:keydown={(e) => e.key === 'Enter' && openLightbox(screenshot)}
					>
						<img src={screenshot.src} alt={screenshot.alt} loading="lazy" />
					</div>
				{/each}
			</div>

			{#if lightboxOpen && currentScreenshot}
				<div
					class="lightbox-overlay"
					on:click={closeLightbox}
					on:touchstart={handleTouchStart}
					on:touchmove={handleTouchMove}
					on:touchend={handleTouchEnd}
					transition:fade={{ duration: 300 }}
				>
					<div
						class="lightbox-content"
						on:click|stopPropagation={() => {}}
						transition:scale={{ duration: 300, start: 0.95 }}
					>
						<img src={currentScreenshot.src} alt={currentScreenshot.alt} />
						<button class="lightbox-close" on:click={closeLightbox}>
							<X size="24" color="#fff" />
						</button>
						<div class="lightbox-nav">
							<button class="nav-btn prev" on:click|stopPropagation={() => navigateScreenshot(-1)}
								>❮</button
							>
							<button class="nav-btn next" on:click|stopPropagation={() => navigateScreenshot(1)}
								>❯</button
							>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<section class="features mb-20">
			<div class="flex items-center justify-center mb-8">
				<Shield class="mr-3 text-purple-500" size="24" />
				<h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">
					Key Features
				</h2>
			</div>
			<ul class="feature-list mx-auto">
				{#each features as feature}
					<li class="flex items-center">
						<span class="icon-feature mr-3">
							<svelte:component this={feature.icon} size="18" color="#8b5cf6" />
						</span>
						{feature.text}
					</li>
				{/each}
			</ul>
		</section>

		<section class="download mb-16">
			<div class="download-card">
				<a href={downloadInfo.url} class="download-button flex items-center">
					<Download class="mr-2" size="18" /> Download Patcher
				</a>
			</div>
		</section>
	</div>

	{#if mounted}
		<div class="absolute bottom-0 left-0 opacity-10 pointer-events-none z-[0]">
			<svg width="200" height="200" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r="40" fill="#8b5cf6" opacity="0.2" />
			</svg>
		</div>
		<div class="absolute top-0 right-0 opacity-10 pointer-events-none z-[0]">
			<svg width="250" height="250" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r="30" fill="#8b5cf6" opacity="0.2" />
			</svg>
		</div>
	{/if}
</div>
