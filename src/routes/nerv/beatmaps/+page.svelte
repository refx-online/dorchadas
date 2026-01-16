<script lang="ts">
    import { onMount } from "svelte";
    import { scale } from 'svelte/transition';
    import { ChevronDown, Music, Shield, Heart, AlertTriangle, CheckCircle, XCircle } from "svelte-feathers";
    import { RankedStatus, statusIntToString } from '$lib/beatmapStatus';
    import type { PageData } from './$types';

    export let data: PageData;

    let beatmapId: string = "";
    let beatmapIdError: string = "";
    let beatmapInfo: any = null;
    let setDifficulties: Array<{ id: number; version: string; diff: number }> = [];
    let selectedDifficultyId: number | null = null;
    let isLoading: boolean = false;
    let actionStatus: string = "";
    let actionMessage: string = "";
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
        beatmapIdError = "Beatmap ID is required";
        return false;
      }

      const numericId = parseInt(beatmapId.trim());
      if (isNaN(numericId) || numericId <= 0) {
        beatmapIdError = "Beatmap ID must be a positive number";
        return false;
      }

      beatmapIdError = "";
      return true;
    };

    const fetchBeatmapInfo = async () => {
      if (!validateBeatmapId()) return;

      isLoading = true;
      actionStatus = "";
      actionMessage = "";

      try {
        const response = await fetch(`/api/get_map_info?id=${beatmapId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch beatmap");
        }

        const responseData = await response.json();

        if (responseData.status !== 'success' || !responseData.map) {
          throw new Error("Beatmap not found");
        }

        const map = responseData.map;

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
          const setResponse = await fetch(`/api/get_map_set?set_id=${map.set_id}`);
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

      } catch (error) {
        beatmapInfo = null;
        actionStatus = "error";
        actionMessage = error instanceof Error ? error.message : "Failed to fetch beatmap information";
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
      actionStatus = "";
      actionMessage = "";

      try {
        const statusString = getStatusString(selectedStatus).toLowerCase().replace(/\s+/g, '');

        const response = await fetch('/api/beatmaps/rank', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': data.csrfToken
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
          actionStatus = "success";

          const oldStatus = beatmapInfo.status;
          beatmapInfo.status = selectedStatus;
          beatmapInfo.statusString = statusIntToString(selectedStatus);

          recentActions = [{
            id: beatmapInfo.id,
            title: beatmapInfo.title,
            artist: beatmapInfo.artist,
            mapper: beatmapInfo.creator,
            action: statusString,
            timestamp: Date.now()
          }, ...recentActions.slice(0, 9)];

          await fetchBeatmapInfo();
        } else {
          throw new Error(responseData.message || 'Failed to update beatmap status');
        }

      } catch (error) {
        actionStatus = "error";
        actionMessage = error instanceof Error ? error.message : 'Failed to update beatmap status';
      } finally {
        isLoading = false;
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              on:input={() => beatmapIdError = ""}
              placeholder="Enter beatmap ID..."
              class:error={beatmapIdError}
            />
            <button
              class="lookup-btn"
              on:click={fetchBeatmapInfo}
              disabled={isLoading}
            >
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
      <div
        class="action-message {actionStatus}"
        transition:scale={{ start: 0.95, duration: 200 }}
      >
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
                on:click={() => scope = 'map'}
                disabled={isLoading}
              >
                MAP
              </button>
              <button
                class="scope-btn {scope === 'set' ? 'active' : ''}"
                on:click={() => scope = 'set'}
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

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #090a0e;
    font-family: 'OCR A Extended', 'Courier New', monospace;
  }

  .nerv-container {
    background-color: #0a0a0f;
    color: #ff3e00;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    border: 2px solid #ff3e00;
    box-shadow:
        0 0 20px rgba(255, 62, 0, 0.5),
        inset 0 0 15px rgba(255, 62, 0, 0.3);
    position: relative;
    overflow: hidden;
    max-width: 100%;
    min-height: 100vh;
  }

  @media (min-width: 768px) {
    .nerv-container {
      padding: 2rem;
    }
  }

  .nerv-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #ff3e00, transparent);
    animation: scan-line 4s linear infinite;
    opacity: 0.5;
    z-index: 1;
  }

  @keyframes scan-line {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(4000%); }
  }

  .nerv-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(
      circle at 2px 2px,
      rgba(255, 62, 0, 0.1) 1px,
      transparent 0
    );
    background-size: 20px 20px;
    pointer-events: none;
    z-index: -1;
  }

  .header-section {
    margin-bottom: 1rem;
    position: relative;
    z-index: 2;
  }

  .terminal-effect {
    border: 1px solid #ff3e00;
    padding: 1rem;
    background: rgba(255, 62, 0, 0.05);
    position: relative;
    overflow: hidden;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .title-icon {
    width: 24px;
    height: 24px;
  }

  h1 {
    font-size: 1.2em;
    text-align: center;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 0 0 10px rgba(255, 62, 0, 0.5);
    animation: title-pulse 2s infinite;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 1.5em;
      letter-spacing: 0.2em;
    }

    .title-icon {
      width: 32px;
      height: 32px;
    }
  }

  @keyframes title-pulse {
    0%, 100% { text-shadow: 0 0 10px rgba(255, 62, 0, 0.5); }
    50% { text-shadow: 0 0 20px rgba(255, 62, 0, 0.8); }
  }

  .subtitle {
    text-align: center;
    font-size: 0.8em;
    opacity: 0.8;
    margin-bottom: 0.5rem;
  }

  .control-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (min-width: 768px) {
    .control-section {
      flex-direction: row;
      align-items: flex-start;
    }

    .beatmap-lookup {
      flex: 1;
    }
  }

  .form-group {
    margin-bottom: 0.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    font-size: 0.9em;
    letter-spacing: 0.05em;
  }

  .input-wrapper {
    display: flex;
    position: relative;
  }

  input {
    flex: 1;
    background: rgba(255, 62, 0, 0.05);
    border: 1px solid #ff3e00;
    color: #ff3e00;
    padding: 0.75rem;
    font-size: 1em;
    font-family: 'OCR A Extended', 'Courier New', monospace;
    transition: all 0.3s ease;
    border-radius: 0;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  input:focus {
    outline: none;
    box-shadow: 0 0 15px rgba(255, 62, 0, 0.3);
  }

  input.error {
    border-color: #ff0033;
    box-shadow: 0 0 15px rgba(255, 0, 51, 0.3);
  }

  .error-message {
    color: #ff0033;
    font-size: 0.8em;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .error-icon {
    width: 14px;
    height: 14px;
  }

  .lookup-btn {
    background: #ff3e00;
    color: #0a0a0f;
    border: none;
    padding: 0 1rem;
    font-family: 'OCR A Extended', 'Courier New', monospace;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .lookup-btn:hover {
    background: #ff5722;
    box-shadow: 0 0 15px rgba(255, 62, 0, 0.5);
  }

  .lookup-btn:disabled {
    background: #666;
    cursor: not-allowed;
  }

  .loading-indicator {
    width: 20px;
    height: 20px;
    position: relative;
  }

  .loading-indicator span {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2px solid transparent;
    border-top-color: #0a0a0f;
    border-radius: 50%;
    animation: spinner 0.8s linear infinite;
  }

  @keyframes spinner {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .action-message {
    padding: 1rem;
    border: 1px solid;
    text-align: center;
    font-weight: bold;
  }

  .action-message.success {
    background: rgba(0, 255, 0, 0.1);
    border-color: #00ff00;
    color: #00ff00;
  }

  .action-message.error {
    background: rgba(255, 0, 0, 0.1);
    border-color: #ff0000;
    color: #ff0000;
  }

  .beatmap-info {
    border: 1px solid #ff3e00;
    background: rgba(255, 62, 0, 0.05);
    padding: 1rem;
  }

  .beatmap-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (min-width: 768px) {
    .beatmap-header {
      flex-direction: row;
    }

    .thumbnail-container {
      width: 240px;
    }

    .beatmap-details {
      flex: 1;
    }
  }

  .thumbnail-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .beatmap-thumbnail {
    width: 100%;
    height: auto;
    border: 1px solid #ff3e00;
    filter: sepia(0.2) hue-rotate(320deg);
  }

  .beatmap-id {
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(10, 10, 15, 0.8);
    color: #ff3e00;
    padding: 0.25rem 0.5rem;
    font-size: 0.8em;
    border-right: 1px solid #ff3e00;
    border-bottom: 1px solid #ff3e00;
  }

  .beatmap-status {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.25rem 0.5rem;
    font-size: 0.8em;
    font-weight: bold;
    border-left: 1px solid;
    border-bottom: 1px solid;
  }

  .status-ranked {
    background: rgba(0, 255, 0, 0.2);
    color: #00ff00;
    border-color: #00ff00;
  }

  .status-approved {
    background: rgba(0, 150, 255, 0.2);
    color: #0096ff;
    border-color: #0096ff;
  }

  .status-qualified {
    background: rgba(150, 0, 255, 0.2);
    color: #9600ff;
    border-color: #9600ff;
  }

  .status-loved {
    background: rgba(255, 0, 255, 0.2);
    color: #ff00ff;
    border-color: #ff00ff;
  }

  .status-pending {
    background: rgba(255, 165, 0, 0.2);
    color: #ffa500;
    border-color: #ffa500;
  }

  .status-notsubmitted, .status-wip {
    background: rgba(150, 150, 150, 0.2);
    color: #969696;
    border-color: #969696;
  }

  .status-inactive, .status-graveyard {
    background: rgba(100, 100, 100, 0.2);
    color: #646464;
    border-color: #646464;
  }

  .beatmap-title {
    font-size: 1.4em;
    margin: 0 0 0.5rem 0;
    text-shadow: 0 0 10px rgba(255, 62, 0, 0.5);
  }

  .beatmap-artist {
    font-size: 1.1em;
    margin-bottom: 0.75rem;
    opacity: 0.9;
  }

  .beatmap-mapper, .beatmap-difficulty {
    font-size: 0.9em;
    margin-bottom: 0.5rem;
    opacity: 0.8;
  }

  .beatmap-stats {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .stat {
    padding: 0.5rem;
    border: 1px solid rgba(255, 62, 0, 0.2);
    background: rgba(255, 62, 0, 0.05);
    min-width: 60px;
    text-align: center;
  }

  .stat-label {
    font-size: 0.8em;
    opacity: 0.7;
    margin-bottom: 0.25rem;
  }

  .stat-value {
    font-size: 1.1em;
    font-weight: bold;
  }

  .ranking-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid rgba(255, 62, 0, 0.3);
    background: rgba(255, 62, 0, 0.02);
  }

  @media (min-width: 768px) {
    .ranking-controls {
      flex-direction: row;
      align-items: flex-end;
    }
  }

  .difficulty-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid rgba(255, 62, 0, 0.3);
    background: rgba(255, 62, 0, 0.02);
  }

  .difficulty-selector label {
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .difficulty-select {
    padding: 0.5rem;
    background: rgba(255, 62, 0, 0.05);
    border: 1px solid #ff3e00;
    color: #ff3e00;
    font-family: 'OCR A Extended', 'Courier New', monospace;
    font-size: 1em;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .difficulty-select:focus {
    outline: none;
    box-shadow: 0 0 15px rgba(255, 62, 0, 0.3);
  }

  .difficulty-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .scope-selector, .status-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scope-selector label, .status-selector label {
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .scope-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .scope-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #ff3e00;
    background: rgba(255, 62, 0, 0.05);
    color: #ff3e00;
    font-family: 'OCR A Extended', 'Courier New', monospace;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
  }

  .scope-btn:hover:not(:disabled) {
    background: rgba(255, 62, 0, 0.2);
  }

  .scope-btn.active {
    background: #ff3e00;
    color: #0a0a0f;
  }

  .scope-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status-select {
    padding: 0.5rem;
    background: rgba(255, 62, 0, 0.05);
    border: 1px solid #ff3e00;
    color: #ff3e00;
    font-family: 'OCR A Extended', 'Courier New', monospace;
    font-size: 1em;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }

  .status-select:focus {
    outline: none;
    box-shadow: 0 0 15px rgba(255, 62, 0, 0.3);
  }

  .status-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  @media (min-width: 768px) {
    .action-buttons {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid;
    background: rgba(10, 10, 15, 0.8);
    color: inherit;
    font-family: 'OCR A Extended', 'Courier New', monospace;
    font-weight: bold;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .submit-btn {
    border-color: #00ff00;
    color: #00ff00;
    flex: 1;
  }

  .submit-btn:hover:not(:disabled) {
    background: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }

  .rank-btn {
    border-color: #00ff00;
    color: #00ff00;
  }

  .rank-btn:hover:not(:disabled) {
    background: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }

  .unrank-btn {
    border-color: #ffa500;
    color: #ffa500;
  }

  .unrank-btn:hover:not(:disabled) {
    background: rgba(255, 165, 0, 0.2);
    box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
  }

  .love-btn {
    border-color: #ff00ff;
    color: #ff00ff;
  }

  .love-btn:hover:not(:disabled) {
    background: rgba(255, 0, 255, 0.2);
    box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  .recent-actions {
    margin-top: 1rem;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2em;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    position: relative;
    display: inline-block;
    padding-bottom: 0.5rem;
  }

  h3::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #ff3e00, transparent);
  }

  .actions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-item {
    border: 1px solid;
    padding: 0.75rem;
    position: relative;
    transition: all 0.3s ease;
  }

  .action-item:hover {
    transform: translateX(5px);
  }

  .action-item::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transform: skewX(-20deg);
    transition: 0.5s;
  }

  .action-item:hover::after {
    left: 150%;
  }

  .action-ranked {
    border-color: rgba(0, 255, 0, 0.5);
    background: rgba(0, 255, 0, 0.05);
  }

  .action-unranked {
    border-color: rgba(255, 165, 0, 0.5);
    background: rgba(255, 165, 0, 0.05);
  }

  .action-loved {
    border-color: rgba(255, 0, 255, 0.5);
    background: rgba(255, 0, 255, 0.05);
  }

  .action-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.8em;
  }

  .action-id {
    opacity: 0.7;
  }

  .action-status {
    font-weight: bold;
  }

  .action-content {
    margin-bottom: 0.5rem;
  }

  .action-title {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .action-artist {
    font-size: 0.9em;
    opacity: 0.9;
    margin-bottom: 0.25rem;
  }

  .action-mapper {
    font-size: 0.8em;
    opacity: 0.8;
  }

  .action-time {
    font-size: 0.8em;
    opacity: 0.7;
    text-align: right;
  }
</style>