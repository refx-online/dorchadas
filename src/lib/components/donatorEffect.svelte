<script lang="ts">
	// TODO: rework
	import { onMount } from 'svelte';

	export let username: string | undefined;
	export let sparkleColor: string = '#ffffff';
	export let particleColor: string = '#ffdf00';
	export let gradientColors: [string, string] = ['#ff6b6b', '#4ecdc4'];

	let sparkles = [];
	let particles = [];

	function generateSparkle() {
		return {
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 10 + 5,
			opacity: 1,
			id: Date.now() + Math.random()
		};
	}

	function generateParticle() {
		return {
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 5 + 2,
			opacity: Math.random(),
			id: Date.now() + Math.random()
		};
	}

	function addSparkle() {
		if (sparkles.length >= 10) sparkles.shift();
		sparkles = [...sparkles, generateSparkle()];
	}

	function addParticle() {
		if (particles.length >= 15) particles.shift();
		particles = [...particles, generateParticle()];
	}

	onMount(() => {
		const sparkleInterval = setInterval(addSparkle, 500);
		const particleInterval = setInterval(addParticle, 200);
		return () => {
			clearInterval(sparkleInterval);
			clearInterval(particleInterval);
		};
	});
</script>

<div
	class="donator-username-container"
	role="button"
	tabindex="0"
	aria-label="Activate sparkles and particles for username"
	on:mouseenter={addSparkle}
	on:mouseleave={() => (sparkles = [])}
>
	<div class="username-wrapper">
		<svg class="star-icon" viewBox="0 0 24 24">
			<path
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
				fill={particleColor}
			/>
		</svg>

		<div
			class="donator-username"
			style="
				background: linear-gradient(45deg, {gradientColors[0]}, {gradientColors[1]});
				background-size: 200% 200%;
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
			"
		>
			{username}
		</div>

		<svg class="star-icon" viewBox="0 0 24 24">
			<path
				d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
				fill={particleColor}
			/>
		</svg>
	</div>

	<div class="sparkle-container">
		{#each sparkles as sparkle (sparkle.id)}
			<svg
				class="sparkle"
				viewBox="0 0 24 24"
				style="
					left: {sparkle.x}%;
					top: {sparkle.y}%;
					width: {sparkle.size}px;
					height: {sparkle.size}px;
				"
			>
				<path
					d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
					fill={sparkleColor}
				/>
			</svg>
		{/each}

		{#each particles as particle (particle.id)}
			<div
				class="particle"
				style="
					left: {particle.x}%;
					top: {particle.y}%;
					width: {particle.size}px;
					height: {particle.size}px;
					opacity: {particle.opacity};
				"
			></div>
		{/each}
	</div>
</div>

<style>
	.donator-username-container {
		position: relative;
		display: inline-block;
		cursor: pointer;
		outline: none;
	}

	.username-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		animation: bounce-text 2s infinite;
	}

	.donator-username {
		font-weight: bold;
		font-size: 2rem;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
	}

	.star-icon {
		width: 1.5rem;
		height: 1.5rem;
		animation: grow-spin 2s infinite;
	}

	.sparkle-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
	}

	.sparkle {
		position: absolute;
		opacity: 0;
		animation: sparkle-animation 1s ease-out forwards;
	}

	.particle {
		position: absolute;
		background-color: particleColor;
		border-radius: 50%;
		animation: particle-fade 1s ease-out forwards;
	}

	@keyframes sparkle-animation {
		0% {
			opacity: 0;
			transform: scale(0) rotate(-45deg);
		}
		30% {
			opacity: 1;
			transform: scale(1.2) rotate(20deg);
		}
		100% {
			opacity: 0;
			transform: scale(1.5) rotate(45deg);
		}
	}

	@keyframes particle-fade {
		0% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-50px);
		}
	}

	@keyframes grow-spin {
		0% {
			transform: scale(0) rotate(0deg);
			opacity: 0.8;
		}
		50% {
			transform: scale(1) rotate(180deg);
			opacity: 1;
		}
		100% {
			transform: scale(0) rotate(360deg);
			opacity: 0.8;
		}
	}

	@keyframes bounce-text {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>