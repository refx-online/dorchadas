<script lang="ts">
	/*
		Cleanup would be better here. i need to refactor the whole table though.
	*/
	import { onMount } from 'svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import { Trophy, Upload, Edit, TrendingDown, ChevronDown } from 'lucide-svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	import type { UsersLog } from '$lib/types';
	import { appUrl } from '$lib/env';

	dayjs.extend(relativeTime);

	export let usersLog: UsersLog[] = [];
	export let userName = '';
	export let beatmapTitles: Record<number, string> = {};

	let showAll = false;

	$: sortedLogs = Array.isArray(usersLog)
		? [...usersLog].sort((a, b) => b.timestamp - a.timestamp)
		: [];

	$: displayedLogs = showAll ? sortedLogs : sortedLogs.slice(0, 5);
	$: hasMoreLogs = sortedLogs.length > 5;

	const activityConfig = {
		rank: { icon: Trophy, color: 'text-yellow-400' },
		submit: { icon: Upload, color: 'text-green-400' },
		update: { icon: Edit, color: 'text-blue-400' },
		lost: { icon: TrendingDown, color: 'text-red-400' }
	};

	function getActivityIcon(type: UsersLog['type']) {
		return activityConfig[type]?.icon ?? Trophy;
	}

	function getActivityColor(type: UsersLog['type']) {
		return activityConfig[type]?.color ?? 'text-gray-400';
	}

	function getActivityText(log: UsersLog) {
		const { type, rank_val, type_id } = log;

		if (type === 'rank') {
			return `achieved rank #${rank_val?.toLocaleString() ?? 'Unknown'} on`;
		} else if (type === 'lost') {
			return 'lost their #1 on';
		} else if (type === 'submit') {
			return 'submitted a beatmap:';
		} else if (type === 'update') {
			return 'updated a beatmap:';
		}
		return 'had some activity';
	}

	function getActivityUrl(log: UsersLog) {
		const { type, type_id } = log;

		if (!type_id) return '#';

		if (type === 'rank' || type === 'lost') {
			return `${appUrl}/scores/${type_id}`;
		} else if (type === 'submit' || type === 'update') {
			return `${appUrl}/beatmaps/${type_id}`;
		} // TODO: changename
		return '#';
	}

	function formatRelativeTime(timestamp: number) {
		return dayjs(timestamp * 1000)
			.locale($userLanguage)
			.fromNow();
	}

	function toggleShowAll() {
		showAll = !showAll;
	}
</script>

{#if usersLog.length > 0}
	<div>
		<h3 class="text-lg font-bold underline underline-offset-4 decoration-2 decoration-primary-400">
			Recent
		</h3>
		<div class="space-y-3">
			{#each displayedLogs as log (log.id)}
				{#if log && log.type}
					<div
						class="flex items-start gap-3 p-3 rounded-lg bg-surface-600/50 hover:bg-surface-600 transition-colors"
					>
						<div class="flex-shrink-0 mt-0.5">
							<svelte:component
								this={getActivityIcon(log.type)}
								size={16}
								class={getActivityColor(log.type)}
							/>
						</div>

						<div class="flex-1 min-w-0">
							<div class="text-sm">
								<span class="font-medium text-primary-200">{userName}</span>
								<span class="text-surface-200 mx-1">
									{getActivityText(log)}
									{#if (log.type === 'rank' || log.type === 'lost' || log.type === 'submit' || log.type === 'update') && log.type_id}
										<a
											href={getActivityUrl(log)}
											target="_blank"
											rel="noopener noreferrer"
											class="text-primary-400 hover:underline ml-1 transition-colors"
										>
											{beatmapTitles[log.type_id] ?? 'unknown Map'}
										</a>
									{/if}
								</span>
							</div>

							<div class="text-xs text-surface-400 mt-1">
								{log.timestamp ? formatRelativeTime(log.timestamp) : 'unknown time'}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>

		{#if hasMoreLogs}
			<button
				class="flex flex-row text-center justify-center items-center btn w-48 mx-auto variant-filled-surface px-4 py-1 mt-2 text-[0.7rem] leading-5"
				on:click={toggleShowAll}
			>
				<ChevronDown
					class="pointer-events-none text-surface-400 {showAll
						? 'rotate-180'
						: ''} transition-transform"
					size={16}
				/>
				<span class="font-semibold">
					{showAll ? __('show less', $userLanguage) : __('show more', $userLanguage)}
				</span>
				<ChevronDown
					class="pointer-events-none text-surface-400 {showAll
						? 'rotate-180'
						: ''} transition-transform"
					size={16}
				/>
			</button>
		{/if}
	</div>
{:else}
	<div class="text-surface-400 text-center py-8">No recent activity</div>
{/if}
