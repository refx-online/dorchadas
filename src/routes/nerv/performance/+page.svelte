<script lang="ts">
	import { goto } from '$app/navigation';
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';

	export let data;

	let userFilter: string = data.userFilter ?? '';

	const flagReport = (r: any): string[] => {
		const flags: string[] = [];
		if (!r.frame_count) flags.push('no frames');
		if (r.spike_frames > 50) flags.push(`${r.spike_frames} spikes`);
		if (r.average_frametime > 33) flags.push(`${r.average_frametime}ms avg`);
		if (!r.completion) flags.push('quit');
		return flags;
	};

	const applyFilter = () => {
		const params = new URLSearchParams();
		if (userFilter.trim()) params.set('user', userFilter.trim());
		goto(`/nerv/performance?${params.toString()}`);
	};
</script>

<div class="container mx-auto w-full p-5">
	<div class="flex flex-col gap-4">
		<div class="flex flex-row items-center justify-between">
			<h1 class="text-2xl font-bold">{__('Performance Reports', $userLanguage)}</h1>
			<div class="flex flex-row gap-2">
				<input
					class="input"
					placeholder="user id or name"
					bind:value={userFilter}
					on:keydown={(e) => e.key === 'Enter' && applyFilter()}
				/>
				<button class="btn variant-filled-primary" on:click={applyFilter}>Filter</button>
			</div>
		</div>

		<p class="text-sm opacity-75">
			Per-play client telemetry (frames, spikes, frame time, poll rate). Flagged rows are worth a
			look, not verdicts.
		</p>

		<div class="table-container">
			<table class="table table-hover">
				<thead>
					<tr>
						<th>Score</th>
						<th>Player</th>
						<th>Mode</th>
						<th>PP</th>
						<th>OS</th>
						<th>Full</th>
						<th>FPS cap</th>
						<th>Frames</th>
						<th>Spikes</th>
						<th>Avg ms</th>
						<th>Aim Hz</th>
						<th>Flags</th>
					</tr>
				</thead>
				<tbody>
					{#each data.reports as r}
						{@const flags = flagReport(r)}
						<tr class:variant-filled-warning={flags.length > 0}>
							<td><a class="anchor" href="/scores/{r.scoreid}">{r.scoreid}</a></td>
							<td><a class="anchor" href="/u/{r.user_id}">{r.username}</a></td>
							<td>{r.mod_mode} ({r.mode})</td>
							<td>{Math.round(r.pp)}</td>
							<td class="truncate max-w-[12rem]" title={r.os}>{r.os}</td>
							<td>{r.fullscreen ? 'yes' : 'no'}</td>
							<td>{r.fps_cap}</td>
							<td>{r.frame_count}</td>
							<td>{r.spike_frames}</td>
							<td>{r.average_frametime}</td>
							<td>{r.aim_rate || '-'}</td>
							<td>{flags.join(', ') || '-'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if !data.reports.length}
				<p class="p-4 opacity-60">No reports yet — they land here as plays are submitted.</p>
			{/if}
		</div>
	</div>
</div>
