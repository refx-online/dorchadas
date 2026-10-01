<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	let hoveredIndex = -1;
	const nervNavItems = [
		{ title: 'Nerv', icon: '⏾', path: '/nerv', description: 'Dashboard' },
		{ title: 'Flags', icon: '⚑', path: '/nerv/flags', description: 'Score Flags' },
		{ title: 'Live', icon: '●', path: '/nerv/live', description: 'Live Ops' },
		{ title: 'Ranking', icon: '🎵', path: '/nerv/beatmaps', description: 'Beatmap Ranking' },
		{ title: 'Performance', icon: '📈', path: '/nerv/performance', description: 'Client Reports' }
	];

	function getRandomOffset() {
		return (Math.random() - 0.5) * 20;
	}
</script>

<div class="nv-root nv-scanlines">
	<div class="scan-line-overlay"></div>
	<slot />
	<div class="honeycomb-nav">
		<div class="honeycomb-container">
			{#each nervNavItems as item, i}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="honeycomb-item"
					class:hovered={hoveredIndex === i}
					class:active={$page.url.pathname === item.path}
					on:click={() => goto(item.path)}
					on:mouseenter={() => (hoveredIndex = i)}
					on:mouseleave={() => (hoveredIndex = -1)}
					style="--delay: {i * 0.1}s"
				>
					{#if hoveredIndex === i}
						<div
							class="honeycomb-content"
							transition:fly={{
								x: getRandomOffset(),
								y: getRandomOffset(),
								duration: 400,
								easing: elasticOut
							}}
						>
							<div class="honeycomb-icon">{item.icon}</div>
							<div class="honeycomb-title">{item.title}</div>
						</div>
					{:else}
						<div class="honeycomb-content">
							<div class="honeycomb-icon">{item.icon}</div>
							<div class="honeycomb-title">{item.title}</div>
						</div>
					{/if}
					<svg class="honeycomb-border" viewBox="0 0 100 100" preserveAspectRatio="none">
						<path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" />
					</svg>
				</div>
			{/each}
		</div>
	</div>
</div>
