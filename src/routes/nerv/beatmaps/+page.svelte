<script lang="ts">
	import './style.postcss';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { Music, AlertTriangle, CheckCircle } from 'svelte-feathers';
	import { RankedStatus, statusIntToString } from '$lib/beatmapStatus';
	import type { PageData } from './$types';
	import { getBeatmap } from '$lib/api';
	import { invalidateAll } from '$app/navigation';

	export let data: PageData;

	let beatmapId: string = '';
	let beatmapIdError: string = '';
	let beatmapInfo: any = null;
	let setDifficulties: Array<{ id: number; version: string; diff: number }> = [];
	let selectedDifficultyId: number | null = null;
	let isLoading: boolean = false;
	let actionStatus: string = '';
	let actionMessage: string = '';
	let scope: 'map' | 'set' = 'map';
	let selectedStatus: RankedStatus = RankedStatus.Ranked;

	let recentActions: Array<{
		id: number;
		title: string;
		artist: string;
		mapper: string;
		action: string;
		timestamp: number;
	}> = [];

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	const validateBeatmapId = () => {
		if (!beatmapId.trim()) {
			beatmapIdError = 'Beatmap ID is required';
			return false;
		}

		const numericId = parseInt(beatmapId.trim());
		if (isNaN(numericId) || numericId <= 0) {
			beatmapIdError = 'Beatmap ID must be a positive number';
			return false;
		}

		beatmapIdError = '';
		return true;
	};

	const fetchBeatmapInfo = async () => {
		if (!validateBeatmapId()) return;

		isLoading = true;
		actionStatus = '';
		actionMessage = '';

		try {
			const result = await getBeatmap(Number(beatmapId));

			if (!result || result.status !== 'success' || !result.map) {
				throw new Error('Beatmap not found');
			}

			const map = result.map;

			beatmapInfo = {
				id: map.id,
				title: map.title,
				artist: map.artist,
				version: map.version,
				creator: map.creator,
				bpm: map.bpm,
				stars: map.diff,
				length: formatTime(map.total_length),
				status: map.status,
				statusString: statusIntToString(map.status),
				submitDate: new Date(map.last_update).toISOString(),
				maxCombo: map.max_combo,
				plays: map.plays,
				passes: map.passes,
				setId: map.set_id,
				cs: map.cs,
				ar: map.ar,
				od: map.od,
				hp: map.hp,
				md5: map.md5,
				mode: map.mode,
				thumbnail: `https://b.refx.online/thumb/${map.set_id}l.jpg`
			};

			selectedDifficultyId = map.id;

			try {
				const setResponse = await fetch(`/api/v1/get_map_set?set_id=${map.set_id}`);
				if (setResponse.ok) {
					const setData = await setResponse.json();
					if (setData.status === 'success' && setData.maps) {
						setDifficulties = setData.maps
							.map((m: any) => ({
								id: m.id,
								version: m.version,
								diff: m.diff
							}))
							.sort((a: any, b: any) => a.diff - b.diff);
					}
				}
			} catch {}
		} catch (err) {
			beatmapInfo = null;
			actionStatus = 'error';
			actionMessage = err instanceof Error ? err.message : 'Failed to fetch beatmap info';
		} finally {
			isLoading = false;
		}
	};

	const getStatusString = (status: RankedStatus): string => {
		switch (status) {
			case RankedStatus.Inactive:
				return 'Inactive';
			case RankedStatus.NotSubmitted:
				return 'Not Submitted';
			case RankedStatus.Pending:
				return 'Pending';
			case RankedStatus.UpdateAvailable:
				return 'Update Available';
			case RankedStatus.Ranked:
				return 'Ranked';
			case RankedStatus.Approved:
				return 'Approved';
			case RankedStatus.Qualified:
				return 'Qualified';
			case RankedStatus.Loved:
				return 'Loved';
			default:
				return 'Unknown';
		}
	};

	const switchDifficulty = async (diffId: number) => {
		if (diffId === selectedDifficultyId) return;

		beatmapId = diffId.toString();
		await fetchBeatmapInfo();
	};

	const performRanking = async () => {
		if (!beatmapInfo) return;

		isLoading = true;
		actionStatus = '';
		actionMessage = '';

		try {
			const statusString = getStatusString(selectedStatus).toLowerCase().replace(/\s+/g, '');

			const response = await fetch('/api/v1/beatmaps/rank', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					status: statusString,
					scope: scope,
					beatmapId: selectedDifficultyId || beatmapInfo.id
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update beatmap status');
			}

			const responseData = await response.json();

			if (responseData.status === 'success') {
				actionMessage = responseData.message;
				actionStatus = 'success';

				const oldStatus = beatmapInfo.status;
				beatmapInfo.status = selectedStatus;
				beatmapInfo.statusString = statusIntToString(selectedStatus);

				recentActions = [
					{
						id: beatmapInfo.id,
						title: beatmapInfo.title,
						artist: beatmapInfo.artist,
						mapper: beatmapInfo.creator,
						action: statusString,
						timestamp: Date.now()
					},
					...recentActions.slice(0, 9)
				];

				await fetchBeatmapInfo();
			} else {
				throw new Error(responseData.message || 'Failed to update beatmap status');
			}
		} catch (error) {
			actionStatus = 'error';
			actionMessage = error instanceof Error ? error.message : 'Failed to update beatmap status';
		} finally {
			isLoading = false;
			await invalidateAll();
		}
	};

	onMount(() => {
		const urlBeatmapId = new URLSearchParams(window.location.search).get('id');
		if (urlBeatmapId && /^\d+$/.test(urlBeatmapId)) {
			beatmapId = urlBeatmapId;
			fetchBeatmapInfo();
		}
	});
</script>

<svelte:head>
	<title>NERV :: Beatmap Ranking</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="nerv-container">
	<div class="header-section">
		<div class="terminal-effect">
			<div class="title-section">
				<Music class="title-icon text-red-400" />
				<h1>NERV BEATMAP RANKING SYSTEM</h1>
			</div>
			<div class="subtitle">// Clearance level: BAT required for modifications //</div>
		</div>
	</div>

	<div class="control-section">
		<div class="beatmap-lookup">
			<div class="form-group">
				<label for="beatmap-id">Beatmap ID</label>
				<div class="input-wrapper">
					<input
						type="text"
						id="beatmap-id"
						bind:value={beatmapId}
						on:input={() => (beatmapIdError = '')}
						placeholder="Enter beatmap ID..."
						class:error={beatmapIdError}
					/>
					<button class="lookup-btn" on:click={fetchBeatmapInfo} disabled={isLoading}>
						{#if isLoading}
							<div class="loading-indicator"><span></span></div>
						{:else}
							LOOKUP
						{/if}
					</button>
				</div>
				{#if beatmapIdError}
					<div class="error-message" transition:scale={{ start: 0.95, duration: 200 }}>
						<AlertTriangle class="error-icon" />
						{beatmapIdError}
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if actionStatus}
		<div class="action-message {actionStatus}" transition:scale={{ start: 0.95, duration: 200 }}>
			{actionMessage}
		</div>
	{/if}

	{#if beatmapInfo}
		<div class="beatmap-info" transition:scale={{ start: 0.95, duration: 300 }}>
			<div class="beatmap-header">
				<div class="thumbnail-container">
					<img src={beatmapInfo.thumbnail} alt="Beatmap Thumbnail" class="beatmap-thumbnail" />
					<div class="beatmap-id">#{beatmapInfo.id}</div>
					<div class="beatmap-status status-{beatmapInfo.statusString.toLowerCase()}">
						{beatmapInfo.statusString.toUpperCase()}
					</div>
				</div>
				<div class="beatmap-details">
					<h2 class="beatmap-title">{beatmapInfo.title}</h2>
					<div class="beatmap-artist">{beatmapInfo.artist}</div>
					<div class="beatmap-mapper">Mapped by: {beatmapInfo.creator}</div>
					<div class="beatmap-difficulty">Version: {beatmapInfo.version}</div>

					<div class="beatmap-stats">
						<div class="stat">
							<div class="stat-label">BPM</div>
							<div class="stat-value">{beatmapInfo.bpm}</div>
						</div>
						<div class="stat">
							<div class="stat-label">Stars</div>
							<div class="stat-value">{beatmapInfo.stars.toFixed(2)}★</div>
						</div>
						<div class="stat">
							<div class="stat-label">Length</div>
							<div class="stat-value">{beatmapInfo.length}</div>
						</div>
						<div class="stat">
							<div class="stat-label">CS</div>
							<div class="stat-value">{beatmapInfo.cs.toFixed(1)}</div>
						</div>
						<div class="stat">
							<div class="stat-label">AR</div>
							<div class="stat-value">{beatmapInfo.ar.toFixed(1)}</div>
						</div>
						<div class="stat">
							<div class="stat-label">OD</div>
							<div class="stat-value">{beatmapInfo.od.toFixed(1)}</div>
						</div>
						<div class="stat">
							<div class="stat-label">HP</div>
							<div class="stat-value">{beatmapInfo.hp.toFixed(1)}</div>
						</div>
					</div>

					<div class="additional-stats">
						<div class="additional-stat">Max Combo: {beatmapInfo.maxCombo}</div>
						<div class="additional-stat">Plays: {beatmapInfo.plays.toLocaleString()}</div>
						<div class="additional-stat">Passes: {beatmapInfo.passes.toLocaleString()}</div>
					</div>
				</div>
			</div>

			{#if setDifficulties.length > 1}
				<div class="difficulty-selector">
					<label for="difficulty-select">Other Difficulties:</label>
					<select
						id="difficulty-select"
						bind:value={selectedDifficultyId}
						on:change={() => {
							if (selectedDifficultyId) {
								switchDifficulty(selectedDifficultyId);
							}
						}}
						disabled={isLoading}
						class="difficulty-select"
					>
						{#each setDifficulties as diff}
							<option value={diff.id}>
								{diff.version} ({diff.diff.toFixed(2)}★)
							</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="ranking-controls">
				<div class="scope-selector">
					<label for="scope-selector">Scope:</label>
					<div class="scope-buttons" id="scope-selector">
						<button
							class="scope-btn {scope === 'map' ? 'active' : ''}"
							on:click={() => (scope = 'map')}
							disabled={isLoading}
						>
							MAP
						</button>
						<button
							class="scope-btn {scope === 'set' ? 'active' : ''}"
							on:click={() => (scope = 'set')}
							disabled={isLoading}
						>
							SET
						</button>
					</div>
				</div>

				<div class="status-selector">
					<label for="status-select">Status:</label>
					<select
						id="status-select"
						bind:value={selectedStatus}
						disabled={isLoading}
						class="status-select"
					>
						<option value={RankedStatus.Pending}>Pending</option>
						<option value={RankedStatus.Ranked}>Ranked</option>
						<option value={RankedStatus.Approved}>Approved</option>
						<option value={RankedStatus.Qualified}>Qualified</option>
						<option value={RankedStatus.Loved}>Loved</option>
					</select>
				</div>

				<button
					class="action-btn submit-btn"
					on:click={performRanking}
					disabled={isLoading || beatmapInfo.status === selectedStatus}
				>
					{#if isLoading}
						<div class="loading-indicator"><span></span></div>
					{:else}
						<CheckCircle class="btn-icon" />
						UPDATE STATUS
					{/if}
				</button>
			</div>
		</div>
	{/if}

	<div class="recent-actions">
		<h3>Recent Actions</h3>
		<div class="actions-list">
			{#each recentActions as action}
				<div class="action-item action-{action.action}">
					<div class="action-header">
						<div class="action-id">#{action.id}</div>
						<div class="action-status">{action.action.toUpperCase()}</div>
					</div>
					<div class="action-content">
						<div class="action-title">{action.title}</div>
						<div class="action-artist">{action.artist}</div>
						<div class="action-mapper">Mapper: {action.mapper}</div>
					</div>
					<div class="action-time">{formatDate(action.timestamp)}</div>
				</div>
			{/each}
		</div>
	</div>
</div>
