<script lang="ts">
	export let data;
</script>

<div class="container mx-auto w-full p-5">
	<div>
		<h1>Live Ops</h1>
		<div class="nv-mincho">作戦監視 // OPERATIONS WATCH</div>
	</div>

	<div class="nv-panel mt-4">
		<div class="nv-panel-header">
			<span>Services ({data.services.filter((s) => s.up).length}/{data.services.length} up)</span
			><span>probed live</span>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each data.services as s}
				<span
					class="nv-badge {s.up ? 'green' : 'red'}"
					title={s.ms >= 0 ? `${s.ms}ms` : 'no http endpoint / unreachable'}
				>
					<span class="nv-led {s.up ? 'green' : 'red'}"></span>{s.name}{s.ms > 0
						? ` ${s.ms}ms`
						: ''}
				</span>
			{/each}
		</div>
	</div>

	<div class="nv-panel mt-4">
		<div class="nv-panel-header">
			<span>Online now ({data.online.length})</span><span>bancho</span>
		</div>
		{#if data.online.length}
			<div class="flex flex-wrap gap-2">
				{#each data.online as p}
					<span class="nv-badge" title={p.match ? `in match: ${p.match}` : 'lobby'}>
						{p.name}{p.match ? ` ⚔ ${p.match}` : ''}
					</span>
				{/each}
			</div>
		{:else}
			<p class="opacity-60">Nobody online.</p>
		{/if}
	</div>

	<div class="nv-panel mt-4">
		<div class="nv-panel-header"><span>Latest scores</span><span>15 most recent</span></div>
		<div class="table-container">
			<table class="nv-table">
				<thead>
					<tr><th>Score</th><th>Player</th><th>Map</th><th>PP</th><th>Acc</th><th>Mode</th></tr>
				</thead>
				<tbody>
					{#each data.recentScores as s}
						<tr>
							<td><a href="/scores/{s.id}">{s.id}</a></td>
							<td><a href="/u/{s.user_id}">{s.username}</a></td>
							<td class="truncate max-w-[20rem]">
								{s.artist ? `${s.artist} - ${s.title} [${s.version}]` : s.map_md5}
							</td>
							<td>{Math.round(s.pp)}</td>
							<td>{Number(s.acc).toFixed(2)}%</td>
							<td>{s.mode}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="nv-panel mt-4">
		<div class="nv-panel-header"><span>Newest accounts</span><span>10 most recent</span></div>
		<div class="flex flex-wrap gap-2">
			{#each data.recentUsers as u}
				<a class="nv-badge" href="/u/{u.id}">{u.name} ({u.country})</a>
			{/each}
		</div>
	</div>
</div>
