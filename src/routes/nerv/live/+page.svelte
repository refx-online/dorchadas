<script lang="ts">
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';

	export let data;
</script>

<div class="container mx-auto w-full p-5">
	<div class="flex flex-col gap-6">
		<h1 class="text-2xl font-bold">{__('Live Ops', $userLanguage)}</h1>

		<section>
			<h2 class="text-lg font-medium mb-2">
				Services ({data.services.filter((s) => s.up).length}/{data.services.length} up)
			</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.services as s}
					<span
						class="badge {s.up ? 'variant-filled-success' : 'variant-filled-error'}"
						title={s.ms >= 0 ? `${s.ms}ms` : 'no http endpoint / unreachable'}
					>
						{s.up ? '●' : '○'}
						{s.name}{s.ms > 0 ? ` ${s.ms}ms` : ''}
					</span>
				{/each}
			</div>
		</section>

		<section>
			<h2 class="text-lg font-medium mb-2">Online now ({data.online.length})</h2>
			{#if data.online.length}
				<div class="flex flex-wrap gap-2">
					{#each data.online as p}
						<span class="badge variant-soft" title={p.match ? `in match: ${p.match}` : 'lobby'}>
							{p.name}{p.match ? ` ⚔ ${p.match}` : ''}
						</span>
					{/each}
				</div>
			{:else}
				<p class="opacity-60">Nobody online.</p>
			{/if}
		</section>

		<section>
			<h2 class="text-lg font-medium mb-2">Latest scores</h2>
			<div class="table-container">
				<table class="table table-hover table-compact">
					<thead>
						<tr><th>Score</th><th>Player</th><th>Map</th><th>PP</th><th>Acc</th><th>Mode</th></tr>
					</thead>
					<tbody>
						{#each data.recentScores as s}
							<tr>
								<td><a class="anchor" href="/scores/{s.id}">{s.id}</a></td>
								<td><a class="anchor" href="/u/{s.user_id}">{s.username}</a></td>
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
		</section>

		<section>
			<h2 class="text-lg font-medium mb-2">Newest accounts</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.recentUsers as u}
					<a class="anchor badge variant-soft" href="/u/{u.id}">{u.name} ({u.country})</a>
				{/each}
			</div>
		</section>
	</div>
</div>
