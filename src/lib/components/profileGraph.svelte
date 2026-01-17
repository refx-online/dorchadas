<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import type { ppProfileHistory } from '$lib/types';
	import { onMount } from 'svelte';

	Chart.register(...registerables);

	export let ppHistory: ppProfileHistory | undefined;

	let chartElement: HTMLCanvasElement | null = null;
	let error: string | null = null;
	let chart: Chart | null = null;

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

	function formatValue(value: number): string {
		return value.toLocaleString() + 'pp';
	}

	function loadChart() {
		if (!chartElement || !ppHistory?.data.captures) {
			error = 'No data available';
			return;
		}

		error = null;

		try {
			if (chart) {
				chart.destroy();
				chart = null;
			}

			const captures = ppHistory.data.captures;
			if (!captures.length) {
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
				y: (c as any).pp,
				date: c.captured_at
			}));

			if (dataPoints.length === 1) {
				dataPoints.push({ ...dataPoints[0], x: 1 });
			}

			chart = new Chart(chartElement, {
				type: 'line',
				data: {
					datasets: [
						{
							label: 'Performance Points',
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
					]
				},
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
									return formatValue(context.parsed.y);
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
		} catch {
			error = 'Failed to load history data';
		}
	}

	onMount(() => {
		if (ppHistory?.data.captures) {
			loadChart();
		}
	});

	$: if (ppHistory?.data.captures && chartElement) {
		loadChart();
	}
</script>

<div class="w-full h-16">
	{#if !ppHistory}
		<div class="flex items-center justify-center h-full text-surface-400 text-sm">No result</div>
	{:else if error}
		<div class="flex items-center justify-center h-full text-surface-400 text-sm">
			{error}
		</div>
	{:else}
		<canvas bind:this={chartElement}></canvas>
	{/if}
</div>
