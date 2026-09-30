<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data;
</script>

<div class="container mx-auto w-full p-5">
	<div>
		<h1>Score Flags</h1>
		<div class="nv-mincho">不正スコア監視 // CHEAT WATCH</div>
	</div>

	<div class="nv-panel mt-4">
		<div class="nv-panel-header">
			<span>Review Queue ({data.flags.length})</span><span
				>dismiss the noise, restrict what's real</span
			>
		</div>
		<div class="table-container">
			<table class="nv-table">
				<thead>
					<tr>
						<th>Score</th>
						<th>Player</th>
						<th>Kind</th>
						<th>Reason</th>
						<th>PP</th>
						<th>Played</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.flags as f}
						<tr>
							<td><a href="/scores/{f.score_id}">{f.score_id}</a></td>
							<td>
								<a href="/u/{f.user_id}">{f.username}</a>
								<a href="/nerv/u/{f.user_id}">[nerv]</a>
							</td>
							<td><span class="nv-badge red">{f.kind}</span></td>
							<td class="truncate max-w-[24rem]" title={f.det}>{f.reason}</td>
							<td>{Math.round(f.pp)}</td>
							<td>{new Date(f.play_time).toLocaleString()}</td>
							<td>
								<form
									method="POST"
									action="?/dismissFlag"
									use:enhance={() => {
										return async ({ result }) => {
											if (result.type === 'success') await invalidateAll();
										};
									}}
								>
									<input type="hidden" name="scoreId" value={f.score_id} />
									<input type="hidden" name="kind" value={f.kind} />
									<button class="nv-badge" type="submit"> Dismiss </button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if !data.flags.length}
				<p class="p-4 opacity-60">Queue is empty. Suspicious scores land here on submit.</p>
			{/if}
		</div>
	</div>
</div>
