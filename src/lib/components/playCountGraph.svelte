<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { TooltipItem } from 'chart.js';

	Chart.register(...registerables);

	export let playCountGraph: Record<string, number>;

	let chartElement: HTMLCanvasElement;

	onMount(() => {
		const dataPoints = Object.values(playCountGraph);
		const labels = Object.keys(playCountGraph);

		const chartData = {
			labels,
			datasets: [{
				data: dataPoints,
				borderColor: 'yellow',
				borderWidth: 2,
				tension: 0.1,
				fill: false,
				pointBackgroundColor: 'yellow',
				pointBorderColor: 'yellow'
			}]
		};

		new Chart(chartElement, {
			type: 'line',
			data: chartData,
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: false
						},
						grid: {
							display: false
						},
						ticks: {
							display: false
						}
					},
					x: {
						title: {
							display: false
						},
						grid: {
							display: false
						},
						ticks: {
							display: false
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						mode: 'index',
						intersect: false,
						displayColors: false,
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						titleAlign: 'center',
						bodyAlign: 'center',
						callbacks: {
							label: (context: TooltipItem<"line">) => {
								return `${context.parsed.y} plays`;
							}
						}
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
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
						ctx.stroke();
						ctx.restore();

						ctx.beginPath();
						ctx.arc(activePoint.element.x, activePoint.element.y, 8, 0, Math.PI * 2);
						ctx.fillStyle = 'yellow';
						ctx.fill();
						ctx.restore();
					}
				}
			}]
		});
	});
</script>

<div class="w-full h-64">
	<canvas bind:this={chartElement}></canvas>
</div>