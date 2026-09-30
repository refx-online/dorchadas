<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';

	export let data;
</script>

<div class="container mx-auto w-full p-5">
	<div class="flex flex-col gap-4">
		<h1 class="text-2xl font-bold">{__('Score Flags', $userLanguage)}</h1>
		<p class="text-sm opacity-75">
			Scores the server accepted but flagged as suspicious. Dismiss the noise, restrict from the
			user page when it's real.
		</p>

		<div class="table-container">
			<table class="table table-hover">
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
							<td><a class="anchor" href="/scores/{f.score_id}">{f.score_id}</a></td>
							<td>
								<a class="anchor" href="/u/{f.user_id}">{f.username}</a>
								<a class="anchor opacity-60" href="/nerv/u/{f.user_id}">[nerv]</a>
							</td>
							<td><span class="badge variant-filled-warning">{f.kind}</span></td>
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
									<button class="btn btn-sm variant-ghost-surface" type="submit"> Dismiss </button>
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
