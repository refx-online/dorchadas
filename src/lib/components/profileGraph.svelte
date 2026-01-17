<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import { getPPProfileHistory } from '$lib/api';
	import type { ppProfileHistory, rankProfileHistory, peakrankProfileHistory } from '$lib/types';
	import { onMount } from 'svelte';

	Chart.register(...registerables);

	export let userId: number;
	export let mode: number;

	let chartElement: HTMLCanvasElement | null = null;
	let error: string | null = null;
	let ppHistory: ppProfileHistory | undefined;
	let rankHistory: rankProfileHistory | undefined;
	let peakRankHistory: peakrankProfileHistory | undefined;
	let chart: Chart | null = null;
	let query: 'pp' | 'rank' = 'rank';
	let mounted = false;
	let currentMode = mode;

	$: isReady = mounted && userId && typeof mode === 'number' && mode >= 0;

	const MAX_AGE_DAYS = 89;
	const MS_PER_DAY = 24 * 60 * 60 * 1000;

	function filterRecentCaptures(captures: any[]): any[] {
		const now = Date.now();
		const maxAge = MAX_AGE_DAYS * MS_PER_DAY;

		return captures.filter((capture) => {
			const captureTime = new Date(capture.captured_at).getTime();
			return now - captureTime <= maxAge;
		});
	}

	function formatTimeAgo(date: string): string {
		const now = Date.now();
		const captureTime = new Date(date).getTime();
		const diffDays = Math.floor((now - captureTime) / MS_PER_DAY);

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7);
			return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
		}
		const months = Math.floor(diffDays / 30);
		return months === 1 ? '1 month ago' : `${months} months ago`;
	}

	function formatValue(value: number, type: 'pp' | 'rank'): string {
		if (type === 'pp') {
			return value.toLocaleString() + 'pp';
		}
		return '#' + value.toLocaleString();
	}

	async function loadChart() {
		if (!isReady || !chartElement) return;

		error = null;

		try {
			if (query === 'pp') {
				ppHistory = await getPPProfileHistory(query, userId, mode);
			} else {
				const [rank, peak] = await Promise.all([
					getPPProfileHistory('rank', userId, mode),
					getPPProfileHistory('peak', userId, mode)
				]);
				rankHistory = rank as rankProfileHistory;
				peakRankHistory = peak as peakrankProfileHistory;
			}

			if (chart) {
				chart.destroy();
				chart = null;
			}

			const captures = query === 'pp' ? ppHistory?.data.captures : rankHistory?.data.captures;
			if (!captures?.length) {
				error = 'No recent data';
				return;
			}

			const filteredCaptures = filterRecentCaptures(captures);
			if (!filteredCaptures.length) {
				error = 'No recent data';
				return;
			}

			const sortedCaptures = filteredCaptures.sort(
				(a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
			);

			const dataPoints = sortedCaptures.map((c, index) => ({
				x: index,
				y: query === 'pp' ? (c as any).pp : (c as any).overall,
				countryRank: query === 'rank' ? (c as any).country : null,
				date: c.captured_at
			}));

			const peakDataPoints =
				query === 'rank' && peakRankHistory?.data.captures
					? filterRecentCaptures(peakRankHistory.data.captures)
							.sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime())
							.map((c, index) => ({
								x: index,
								y: c.rank,
								date: c.captured_at
							}))
					: [];

			if (dataPoints.length === 1) {
				dataPoints.push({ ...dataPoints[0], x: 1 });
			}

			const datasets = [
				{
					label: query === 'pp' ? 'Performance Points' : 'Global Rank',
					data: dataPoints,
					borderColor: '#818cf8',
					borderWidth: 2,
					tension: 0.1,
					pointRadius: 0,
					pointHoverRadius: 6,
					pointHoverBackgroundColor: '#818cf8',
					pointHoverBorderColor: '#fff',
					pointHoverBorderWidth: 2,
					fill: false
				}
			];

			if (query === 'rank' && peakDataPoints.length) {
				datasets.push({
					label: 'Peak Rank',
					data: peakDataPoints,
					borderColor: '#f87171',
					borderWidth: 2,
					tension: 0.1,
					pointRadius: 0,
					pointHoverRadius: 6,
					pointHoverBackgroundColor: '#f87171',
					pointHoverBorderColor: '#fff',
					pointHoverBorderWidth: 2,
					fill: false
				});
			}

			chart = new Chart(chartElement, {
				type: 'line',
				data: { datasets },
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: {
						mode: 'index',
						intersect: false
					},
					scales: {
						x: {
							type: 'linear',
							display: false
						},
						y: {
							reverse: query === 'rank',
							display: false
						}
					},
					plugins: {
						tooltip: {
							enabled: true,
							mode: 'index',
							intersect: false,
							backgroundColor: 'rgba(15, 15, 23, 0.95)',
							borderColor: 'rgba(129, 140, 248, 0.3)',
							borderWidth: 1,
							padding: 12,
							titleFont: { size: 13, weight: '600' },
							bodyFont: { size: 12 },
							titleColor: '#f8fafc',
							bodyColor: '#e2e8f0',
							cornerRadius: 6,
							displayColors: false,
							callbacks: {
								title: (items) => {
									if (items.length > 0) {
										const point = dataPoints[items[0].dataIndex];
										return formatTimeAgo(point.date);
									}
									return '';
								},
								label: (context) => {
									if (query === 'pp') {
										return formatValue(context.parsed.y, 'pp');
									} else {
										if (context.datasetIndex === 0) {
											const point = dataPoints[context.dataIndex];
											return [
												'Global: ' + formatValue(point.y, 'rank'),
												'Country: ' + formatValue(point.countryRank, 'rank')
											];
										} else {
											return 'Peak: ' + formatValue(context.parsed.y, 'rank');
										}
									}
								}
							}
						},
						legend: {
							display: false
						}
					}
				},
				plugins: [
					{
						id: 'crosshair',
						afterDraw: (chart) => {
							const activeElements = chart.tooltip?.getActiveElements();
							if (!activeElements?.length) return;

							const { ctx, chartArea } = chart;
							const x = activeElements[0].element.x;

							ctx.save();
							ctx.beginPath();
							ctx.moveTo(x, chartArea.top);
							ctx.lineTo(x, chartArea.bottom);
							ctx.lineWidth = 1;
							ctx.strokeStyle = 'rgba(129, 140, 248, 0.3)';
							ctx.stroke();
							ctx.restore();
						}
					}
				]
			});
		} catch (err) {
			console.error('Error loading history data:', err);
			error = 'Failed to load history data';
		}
	}

	onMount(() => {
		mounted = true;
		currentMode = mode;
		if (isReady) loadChart();
	});

	$: if (mounted && mode !== currentMode) {
		currentMode = mode;
		if (isReady) loadChart();
	}

	$: if (isReady && query) {
		loadChart();
	}
</script>

<div class="flex flex-col gap-3 w-full">
	<div class="flex gap-1.5 justify-end p-1 bg-surface-200 rounded-lg w-fit ml-auto">
		<button
			class="px-3 py-1.5 text-sm rounded-md transition-colors font-medium {query === 'pp'
				? 'bg-indigo-500 text-white shadow-sm'
				: 'text-surface-400 hover:text-surface-100'}"
			on:click={() => (query = 'pp')}
		>
			PP
		</button>
		<button
			class="px-3 py-1.5 text-sm rounded-md transition-colors font-medium {query === 'rank'
				? 'bg-indigo-500 text-white shadow-sm'
				: 'text-surface-400 hover:text-surface-100'}"
			on:click={() => (query = 'rank')}
		>
			Rank
		</button>
	</div>

	<div class="w-full h-16">
		{#if !isReady}
			<div class="flex items-center justify-center h-full text-surface-400 text-sm">
				Loading...
			</div>
		{:else if error}
			<div class="flex items-center justify-center h-full text-surface-400 text-sm">
				{error}
			</div>
		{:else}
			<canvas bind:this={chartElement}></canvas>
		{/if}
	</div>
</div>
