<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import { getPPProfileHistory } from '$lib/api';
	import type { ppProfileHistory, rankProfileHistory, peakrankProfileHistory } from '$lib/types';

	Chart.register(...registerables);

	export let userId: number;
	export let mode: number;

	let chartElement: HTMLCanvasElement | null = null;
	let error: string | null = null;
	let ppHistory: ppProfileHistory | undefined;
	let rankHistory: rankProfileHistory | undefined;
	let peakRankHistory: peakrankProfileHistory | undefined;
	let chart: Chart | null = null;
	let query: 'pp' | 'rank' | 'peak' = 'pp';

	// this gave me migrane
	function timeAgo(date: string, allDates: string[]): string {
		const currentTime = new Date().getTime();
		const inputTime = new Date(date).getTime();
		const diffDays = Math.floor((currentTime - inputTime) / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) {
			const todayDates = allDates
				.filter(d => {
					const time = new Date(d).getTime();
					return Math.floor((currentTime - time) / (1000 * 60 * 60 * 24)) === 0;
				})
				.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

			if (new Date(date).getTime() === new Date(todayDates[0]).getTime()) {
				return 'now';
			}
			return '1 day ago';
		}
		
		return diffDays === 1 ? '2 days ago' : `${diffDays + 1} days ago`;
	}
	
	async function loadChart() {
		try {
			if (query === 'pp') {
				let pp = await getPPProfileHistory(query, userId, mode);
				ppHistory = pp;
			} else if (query === 'rank') {
				let rank = await getPPProfileHistory(query, userId, mode);
				let peak = await getPPProfileHistory('peak', userId, mode);
				rankHistory = rank as rankProfileHistory;
				peakRankHistory = peak as peakrankProfileHistory;
			}
			
			if (chart != null) {
				chart.destroy();
				chart = null;
			}

			const captures = query === 'pp' 
				? ppHistory?.data.captures
				: rankHistory?.data.captures;

			if (!captures?.length) {
				error = 'No recent data';
				return;
			}

			const sortedCaptures = captures.sort((a, b) => 
				new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
			);

			const allDates = sortedCaptures.map(c => c.captured_at);

			const dataPoints = sortedCaptures.map((c, index) => ({
				x: index,
				y: query === 'pp' ? (c as any).pp : (c as any).overall,
				countryRank: query === 'rank' ? (c as any).country : null,
				label: timeAgo(c.captured_at, allDates),
				originalDate: c.captured_at
			}));

			const peakDataPoints = query === 'rank' && peakRankHistory?.data.captures 
				? peakRankHistory.data.captures.map((c, index) => ({
					x: index,
					y: c.rank,
					label: timeAgo(c.captured_at, allDates),
					originalDate: c.captured_at
				}))
				: [];

			if (dataPoints.length === 1) {
				dataPoints.push({
					x: dataPoints[0].x + 1,
					y: dataPoints[0].y,
					countryRank: dataPoints[0].countryRank,
					label: '',
					originalDate: dataPoints[0].originalDate
				});
			}

			const chartData = {
				datasets: [
					{
						data: dataPoints,
						borderColor: '#818cf8',
						borderWidth: 2,
						tension: 0.1,
						pointRadius: 0,
						pointHoverRadius: 5,
						pointHoverBackgroundColor: '#818cf8',
						pointHoverBorderColor: '#818cf8',
						fill: false
					},
					...(query === 'rank' && peakDataPoints.length ? [{
						data: peakDataPoints,
						borderColor: '#f87171',
						borderWidth: 2,
						tension: 0.1,
						pointRadius: 0,
						pointHoverRadius: 5,
						pointHoverBackgroundColor: '#f87171',
						pointHoverBorderColor: '#f87171',
						fill: false
					}] : [])
				]
			};

			chart = new Chart(chartElement, {
				type: 'line',
				data: chartData,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						x: {
							type: 'linear',
							display: true,
							grid: {
								display: false
							},
							ticks: {
								display: false
							}
						},
						y: {
							reverse: query === 'rank',
							beginAtZero: false,
							grid: {
								display: false
							},
							ticks: {
								display: false
							}
						}
					},
					plugins: {
						tooltip: {
							mode: 'index',
							intersect: false,
							displayColors: false,
							backgroundColor: 'rgba(0, 0, 0, 0.7)',
							titleAlign: 'center',
							bodyAlign: 'center',
							callbacks: {
								label: (context) => {
									if (query === 'pp') {
										const point = dataPoints[context.dataIndex];
										return `${point.y}pp`;
									} else {
										if (context.datasetIndex === 0) {
											const point = dataPoints[context.dataIndex];
											return [
												`Global: #${point.y}`,
												`Country: #${point.countryRank}`,
											];
										}
									}
								},
								title: (context) => {
									if (context.length > 0) {
										const point = dataPoints[context[0].dataIndex];
										return point.label || timeAgo(point.originalDate, allDates);
									}
									return '';
								}
							}
						},
						legend: {
							display: false
						}
					},
					hover: {
						mode: 'nearest',
						intersect: false
					}
				},
				plugins: [{
					id: 'crosshair',
					afterDraw: (chart) => {
						const { ctx, chartArea, scales } = chart;

						const tooltipActiveElements = chart.tooltip?.getActiveElements();
						
						if (tooltipActiveElements?.length) {
							const activePoint = tooltipActiveElements[0];
							
							ctx.save();
							ctx.beginPath();
							ctx.moveTo(activePoint.element.x, chartArea.top);
							ctx.lineTo(activePoint.element.x, chartArea.bottom);
							ctx.lineWidth = 1;
							ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
							ctx.stroke();
							ctx.restore();
						}
					}
				}]
			});
		} catch (err) {
			console.error('Error loading history data:', err);
			error = 'Failed to load history data';
		}
	}

	$: if (userId && typeof mode === 'number') {
		error = null;
		loadChart();
	}
</script>

<div class="flex flex-col gap-2 w-full">
	<div class="flex gap-2 justify-end">
		<button 
			class="px-2 py-1 text-sm rounded {query === 'pp' ? 'bg-indigo-500' : 'bg-surface-200'}"
			on:click={() => { query = 'pp'; loadChart(); }}>
			pp
		</button>
		<button 
			class="px-2 py-1 text-sm rounded {query === 'rank' ? 'bg-indigo-500' : 'bg-surface-200'}"
			on:click={() => { query = 'rank'; loadChart(); }}>
			Rank
		</button>
	</div>
	<div class="w-full h-16">
		{#if error != null}
			<div class="flex items-center justify-center h-full text-surface-400">
				{error}
			</div>
		{:else}
			<canvas bind:this={chartElement}></canvas>
		{/if}
	</div>
</div>
