<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { encodeCategory, TYPE_DESCRIPTIONS, type Category } from '$lib/modes';

	export let currentType: Category = 'vanilla';
	export let currentMode: string = 'osu';
	export let disabled: boolean = false;
	// single-line layout: base + variant + gamemodes in one wrapping row,
	// gamemodes pushed right. used where vertical space is tight.
	export let singleLine: boolean = false;

	const dispatch = createEventDispatcher<{ select: { type: Category; mode: string } }>();

	const BASES = [
		{ id: 'vanilla', label: 'Vanilla' },
		{ id: 'cheat', label: 'Cheat' }
	] as const;

	const VARIANTS = [
		{ id: 'std', label: 'Standard' },
		{ id: 'rx', label: 'RX' },
		{ id: 'ap', label: 'AP' }
	] as const;

	const GAMES = [
		{ id: 'osu', label: 'osu!', icon: '/modes/osu.png' },
		{ id: 'taiko', label: 'taiko', icon: '/modes/taiko.png' },
		{ id: 'catch', label: 'catch', icon: '/modes/catch.png' },
		{ id: 'mania', label: 'mania', icon: '/modes/mania.png' }
	];

	$: base = currentType.startsWith('cheat') ? 'cheat' : 'vanilla';
	$: variant = currentType.endsWith('-rx') ? 'rx' : currentType.endsWith('-ap') ? 'ap' : 'std';

	function categoryFor(b: string, v: string): Category {
		if (b === 'cheat') {
			if (v === 'rx') return 'cheat-rx';
			if (v === 'ap') return 'cheat-ap';
			return 'cheat';
		}
		if (v === 'rx') return 'vanilla-rx';
		if (v === 'ap') return 'vanilla-ap';
		return 'vanilla';
	}

	function gameValid(game: string, type: Category): boolean {
		return encodeCategory(game, type) !== null;
	}

	function pick(type: Category, mode: string) {
		if (disabled) return;
		if (type === currentType && mode === currentMode) return;
		// never emit an invalid combo; fall back to osu! if needed
		const game = gameValid(mode, type) ? mode : 'osu';
		if (type === currentType && game === currentMode) return;
		dispatch('select', { type, mode: game });
	}

	function pickBase(b: string) {
		pick(categoryFor(b, variant), currentMode);
	}

	function pickVariant(v: string) {
		pick(categoryFor(base, v), currentMode);
	}
</script>

{#if singleLine}
	<div class="w-full flex flex-wrap items-center gap-x-3 gap-y-1">
		<div class="flex" role="group" aria-label="Category">
			{#each BASES as b, i}
				<button
					class="flex-1 !scale-100 btn {base == b.id
						? 'bg-surface-500'
						: 'bg-surface-600'} {i === 0 ? 'rounded-lg rounded-r-none' : 'rounded-lg rounded-l-none'}"
					on:click={() => pickBase(b.id)}
					title={TYPE_DESCRIPTIONS[categoryFor(b.id, variant)]}
					disabled={disabled}
				>
					{b.label}
				</button>
			{/each}
		</div>
		<div class="flex" role="group" aria-label="Variant">
			{#each VARIANTS as v, i}
				<button
					class="flex-1 !scale-100 btn {variant == v.id
						? 'bg-surface-500'
						: 'bg-surface-600'} {i === 0
						? 'rounded-lg rounded-r-none'
						: i === VARIANTS.length - 1
							? 'rounded-lg rounded-l-none'
							: 'rounded-none'}"
					on:click={() => pickVariant(v.id)}
					title={TYPE_DESCRIPTIONS[categoryFor(base, v.id)]}
					disabled={disabled}
				>
					{v.label}
				</button>
			{/each}
		</div>
		<div class="flex md:ml-auto" role="group" aria-label="Gamemode">
			{#each GAMES as g, i}
				<button
					class="!scale-100 btn {currentMode == g.id
						? 'bg-surface-500'
						: 'bg-surface-600'} {i === 0
						? 'rounded-lg rounded-r-none'
						: i === GAMES.length - 1
							? 'rounded-lg rounded-l-none'
							: 'rounded-none'}"
					on:click={() => pick(currentType, g.id)}
					title={g.label}
					disabled={disabled || !gameValid(g.id, currentType)}
				>
					<img src={g.icon} alt="" class="w-4 h-4 inline-block mr-1 align-text-bottom" />
					{g.label}
				</button>
			{/each}
		</div>
	</div>
{:else}
<div class="w-full flex flex-col lg:flex-row gap-2 lg:items-center">
	<!-- left: base + variant -->
	<div class="flex flex-col gap-1 lg:justify-start">
		<div class="flex w-full" role="group" aria-label="Category">
			{#each BASES as b, i}
				<button
					class="flex-1 !scale-100 btn {base == b.id
						? 'bg-surface-500'
						: 'bg-surface-600'} {i === 0 ? 'rounded-lg rounded-r-none' : 'rounded-lg rounded-l-none'}"
					on:click={() => pickBase(b.id)}
					title={TYPE_DESCRIPTIONS[categoryFor(b.id, variant)]}
					disabled={disabled}
				>
					{b.label}
				</button>
			{/each}
		</div>
		<div class="flex w-full" role="group" aria-label="Variant">
			{#each VARIANTS as v, i}
				<button
					class="flex-1 !scale-100 btn {variant == v.id
						? 'bg-surface-500'
						: 'bg-surface-600'} {i === 0
						? 'rounded-lg rounded-r-none'
						: i === VARIANTS.length - 1
							? 'rounded-lg rounded-l-none'
							: 'rounded-none'}"
					on:click={() => pickVariant(v.id)}
					title={TYPE_DESCRIPTIONS[categoryFor(base, v.id)]}
					disabled={disabled}
				>
					{v.label}
				</button>
			{/each}
		</div>
	</div>
	<!-- right: gamemodes with official icons -->
	<div class="flex w-full lg:w-auto lg:ml-auto lg:justify-end" role="group" aria-label="Gamemode">
		{#each GAMES as g, i}
			<button
				class="flex-1 lg:flex-none !scale-100 btn {currentMode == g.id
					? 'bg-surface-500'
					: 'bg-surface-600'} {i === 0
					? 'rounded-lg rounded-r-none'
					: i === GAMES.length - 1
						? 'rounded-lg rounded-l-none'
						: 'rounded-none'}"
				on:click={() => pick(currentType, g.id)}
				title={g.label}
				disabled={disabled || !gameValid(g.id, currentType)}
			>
				<img src={g.icon} alt="" class="w-4 h-4 inline-block mr-1 align-text-bottom" />
				{g.label}
			</button>
		{/each}
	</div>
</div>
{/if}
