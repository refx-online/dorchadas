<script lang="ts">
	import { getCountryName } from '$lib/country';
	import type { Mod } from '$lib/types';
	import Popup from './Popup.svelte';

	export let tooltip: boolean = true;
	export let mod: Mod;
	export let size: number = 20;
	export let showSettings: boolean = false;

	function shouldShowSpeedMultiplier(mod: Mod): boolean {
		if (!mod.settings) return false;
		
		const isSpeedMod = ['DT', 'NC', 'HT'].includes(mod.short_name.toUpperCase());
		const hasSpeedSetting = mod.settings.speed_change || mod.settings.clock_rate;
		
		return isSpeedMod && hasSpeedSetting;
	}

	function getSpeedMultiplier(mod: Mod): string {
		if (!mod.settings) return '';
		
		const speed = mod.settings.speed_change || mod.settings.clock_rate;
		if (!speed) return '';
		
		return `${speed}x`;
	}

	function getModImageName(shortName: string): string {
		const modsWithImages = ['ez', 'nf', 'ht', 'hr', 'sd', 'pf', 'dt', 'nc', 'hd', 'fl', 'so', 'td', 'v2', 'rx', 'ap', 'cl'];
		const lowerName = shortName.toLowerCase();
		
		return modsWithImages.includes(lowerName) ? lowerName : 'fun';
	}

	function formatModSettings(settings: Record<string, any>): string {
		if (!settings || Object.keys(settings).length === 0) {
			return '';
		}
		
		const settingsArray = [];
		for (const [key, value] of Object.entries(settings)) {
			if (key === 'speed_change' || key === 'clock_rate') {
				settingsArray.push(`${(value * 100).toFixed(0)}%`);
			} else if (key === 'circle_size' || key === 'cs') {
				settingsArray.push(`CS${value}`);
			} else if (key === 'approach_rate' || key === 'ar') {
				settingsArray.push(`AR${value}`);
			} else if (key === 'overall_difficulty' || key === 'od') {
				settingsArray.push(`OD${value}`);
			} else if (key === 'hp_drain_rate' || key === 'hp') {
				settingsArray.push(`HP${value}`);
			}
		}
		
		return settingsArray.slice(0, 3).join(' ');
	}

	function formatModSettingsTooltip(settings: Record<string, any>): string {
		if (!settings || Object.keys(settings).length === 0) {
			return '';
		}
		
		const settingsArray = [];
		for (const [key, value] of Object.entries(settings)) {
			if (key === 'speed_change' || key === 'clock_rate') {
				settingsArray.push(`Speed: ${(value * 100).toFixed(1)}%`);
			} else if (key === 'circle_size' || key === 'cs') {
				settingsArray.push(`Circle Size: ${value}`);
			} else if (key === 'approach_rate' || key === 'ar') {
				settingsArray.push(`Approach Rate: ${value}`);
			} else if (key === 'overall_difficulty' || key === 'od') {
				settingsArray.push(`Overall Difficulty: ${value}`);
			} else if (key === 'drain_rate' || key === 'hp') {
				settingsArray.push(`HP Drain: ${value}`);
			} else {
				settingsArray.push(`${key}: ${value}`);
			}
		}
		return settingsArray.join('\n');
	}

	$: modImageName = getModImageName(mod.short_name);
	$: hasSettings = mod.settings && Object.keys(mod.settings).length > 0;
	$: formattedSettings = hasSettings ? formatModSettings(mod.settings) : '';
	$: tooltipSettings = hasSettings ? formatModSettingsTooltip(mod.settings) : '';
	$: shouldShowSettingsOverlay = showSettings && hasSettings && formattedSettings.length > 0 && !shouldShowSpeedMultiplier(mod);
	$: showSpeedText = shouldShowSpeedMultiplier(mod);
	$: speedText = showSpeedText ? getSpeedMultiplier(mod) : '';
</script>

{#if tooltip}
	<Popup>
		<div class="mod-container-with-text">
			<div class="mod-container">
				<span
					class="flag-country"
					style="--height: {size}px; background-image: url(/mods/{modImageName}.png);"
				></span>
				{#if shouldShowSettingsOverlay}
					<div class="mod-settings" style="font-size: {size * 0.3}px;">
						{formattedSettings}
					</div>
				{:else if showSettings && hasSettings && !showSpeedText}
					<div class="mod-indicator"></div>
				{/if}
			</div>
			{#if showSpeedText}
				<span class="speed-text" style="font-size: {size * 0.6}px;">
					{speedText}
				</span>
			{/if}
		</div>
		<svelte:fragment slot="popup">
			<div class="flex flex-col gap-2 card variant-filled-surface p-2 rounded-lg text-xs max-w-xs">
				<div class="font-semibold">{mod.name}</div>
				{#if hasSettings}
					<div class="text-gray-300 text-xs whitespace-pre-line">
						{tooltipSettings}
					</div>
				{/if}
			</div>
		</svelte:fragment>
	</Popup>
{:else}
	<div class="mod-container-with-text">
		<div class="mod-container">
			<span
				class="flag-country"
				style="--height: {size}px; background-image: url(/mods/{modImageName}.png);"
			></span>
			{#if shouldShowSettingsOverlay}
				<div class="mod-settings" style="font-size: {size * 0.3}px;">
					{formattedSettings}
				</div>
			{:else if showSettings && hasSettings && !showSpeedText}
				<div class="mod-indicator"></div>
			{/if}
		</div>
		{#if showSpeedText}
			<span class="speed-text" style="font-size: {size * 0.6}px;">
				{speedText}
			</span>
		{/if}
	</div>
{/if}

<style>
	.mod-container-with-text {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}

	.mod-container {
		position: relative;
		display: inline-block;
	}

	.flag-country {
		--width-height-ratio: 1.5;
		background-position: 50%;
		background-repeat: no-repeat;
		background-size: cover;
		border-radius: 3px;
		display: block;
		filter: saturate(1.1);
		height: var(--height);
		position: relative;
		transform: translateZ(0);
		width: calc(var(--height) * var(--width-height-ratio));
	}

	.speed-text {
		color: #ffffff;
		font-weight: 600;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
		line-height: 1;
		white-space: nowrap;
	}

	.mod-settings {
		position: absolute;
		bottom: -2px;
		right: -2px;
		background: rgba(0, 0, 0, 0.9);
		color: white;
		padding: 1px 3px;
		border-radius: 2px;
		line-height: 1;
		white-space: nowrap;
		pointer-events: none;
		z-index: 10;
		border: 1px solid rgba(255, 255, 255, 0.2);
		font-weight: 500;
	}

	.mod-settings:empty {
		display: none;
	}

	.mod-indicator {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 6px;
		height: 6px;
		background: #ff6b6b;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.5);
		z-index: 10;
	}
</style>