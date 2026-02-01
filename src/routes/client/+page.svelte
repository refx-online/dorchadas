<script>
	import './style.postcss';
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { X } from 'svelte-feathers';

	import { Download, Zap, Activity } from 'svelte-feathers';

	let mounted = false;
	let lightboxOpen = false;
	let currentScreenshot = null;
	let touchStartX = 0;
	let touchEndX = 0;

	const screenshots = [
		{
			id: 1,
			src: '/client/screenshot-1.jpg',
			alt: 'a'
		},
		{
			id: 2,
			src: '/client/screenshot-2.jpg',
			alt: 'b'
		},
		{
			id: 3,
			src: '/client/screenshot-3.jpg',
			alt: 'c'
		}
	];

	const downloadInfo = {
		url: 'https://github.com/refx-online/refxUpdater/releases/'
	};

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
	<title>re;fx :: The Client</title>
</svelte:head>

<div class="client-container min-h-screen relative z-[1] overflow-hidden">
	{#if mounted}
		<div class="absolute inset-0 opacity-10 blur-3xl z-[0]">
			<div class="absolute w-80 h-80 bg-cyan-500/30 rounded-full -top-10 -left-10"></div>
			<div class="absolute w-96 h-96 bg-blue-500/30 rounded-full top-1/3 right-1/4"></div>
			<div class="absolute w-80 h-80 bg-purple-500/30 rounded-full -bottom-20 -right-20"></div>
		</div>
	{/if}

	<div class="container mx-auto px-4 py-16 relative z-[2]">
		<header class="text-center mb-16">
			<div class="flex justify-center mb-4">
				<div class="icon-wrapper">
					<Zap size="36" color="#06b6d4" />
				</div>
			</div>
			<h1 class="text-5xl font-bold mb-3 text-white">re;fx Client</h1>
		</header>

		<section class="description mb-20 text-center mx-auto">
			<div class="flex items-center justify-center mb-6">
				<Activity class="mr-3 text-cyan-400" size="24" />
				<h2 class="text-3xl font-semibold pb-2 border-b border-gray-800 text-white">About</h2>
			</div>
			<p class="text-lg max-w-3xl mx-auto text-gray-300 mb-4">
				This client is what makes this server exists. Let's not think that i copied this page from
				patcher
			</p>
		</section>

		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<section class="screenshots mb-20">
			<div class="screenshot-grid">
				{#each screenshots as screenshot}
					<div
						class="screenshot-card"
						on:click={() => openLightbox(screenshot)}
						on:keydown={(e) => e.key === 'Enter' && openLightbox(screenshot)}
					>
						<img src={screenshot.src} alt={screenshot.alt} loading="lazy" />
						<div class="screenshot-overlay">
							<span class="screenshot-label">{screenshot.alt}</span>
						</div>
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

		<section class="download mb-16">
			<div class="download-card">
				<div class="download-content">
					<a href={downloadInfo.url} class="download-button flex items-center">
						<Download class="mr-2" size="20" /> Download Updater
					</a>
				</div>
			</div>
		</section>
	</div>

	{#if mounted}
		<div class="absolute bottom-0 left-0 opacity-10 pointer-events-none z-[0]">
			<svg width="200" height="200" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r="40" fill="#06b6d4" opacity="0.2" />
			</svg>
		</div>
		<div class="absolute top-1/4 right-0 opacity-10 pointer-events-none z-[0]">
			<svg width="250" height="250" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r="30" fill="#06b6d4" opacity="0.2" />
			</svg>
		</div>
	{/if}
</div>
