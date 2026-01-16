<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from '../../$types';
	import { avatarUrl } from '$lib/env';
	import { onMount } from 'svelte';
	import { Privileges } from '$lib/privs';
	import { fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	export let data: PageData;

	let editMode: { [key: string]: boolean } = {};
	let editValues: { [key: string]: string } = {};

	let showChangePassword = false;
	let showWipeConfirm = false;
	let showSilenceModal = false;
	let silenceDuration = 1; // Default 1 hour
	let silenceReason = '';
	let confirmPassword = '';

	let notifications: Array<{ id: number; message: string; type: 'success' | 'error' }> = [];
	let notificationCount = 0;

	const EDITABLE_FIELDS = [
		{ key: 'name', label: 'Username' },
		{ key: 'country', label: 'Country' },
		{ key: 'userpage_content', label: 'Profile Content', type: 'textarea' }
	];

	const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
		const id = notificationCount++;
		notifications = [...notifications, { id, message, type }];
		setTimeout(() => {
			notifications = notifications.filter((n) => n.id !== id);
		}, 3000);
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp * 1000).toLocaleString();
	};

	const formatPrivileges = (priv: any) => {
		const privileges = Object.entries(Privileges)
			.filter(([_, flag]) => (priv & (flag as number)) !== 0)
			.map(([name]) => name);
		return privileges.length > 0 ? privileges.join(', ') : 'None';
	};

	const toggleEdit = (field: string) => {
		editMode[field] = !editMode[field];
		if (editMode[field]) {
			editValues[field] = data.user[field];
		} else {
			editValues[field] = '';
		}
	};

	const truncateText = (text: string, limit: number) => {
		if (text === null) return '';

		return text.length > limit ? text.slice(0, limit) + '...' : text;
	};

	$: isUserRestricted = !(data.user.priv & 1);
	$: isUserSilenced = data.user.silence_end > Date.now() / 1000;

	// Action Handlers
	const handleRestriction = async () => {
		const action = isUserRestricted ? 'unrestrict' : 'restrict';
		const form = new FormData();
		form.append('userId', data.user.id.toString());

		const res = await fetch(`?/${action}User`, {
			method: 'POST',
			body: form
		});

		const result = await res.json();
		addNotification(`User ${action}ed successfully`);
		data.user.priv = result.newPriv;
		location.reload();
	};

	const handleSilence = async () => {
		if (!silenceDuration || !silenceReason) {
			addNotification('Please provide duration and reason', 'error');
			return;
		}

		const form = new FormData();
		form.append('userId', data.user.id.toString());
		form.append('duration', silenceDuration.toString());
		form.append('reason', silenceReason);

		const res = await fetch('?/silenceUser', {
			method: 'POST',
			body: form
		});

		const result = await res.json();
		addNotification('User silenced successfully');
		data.user.silence_end = result.silenceEnd;
		showSilenceModal = false;
		silenceReason = '';
	};

	const handleUnsilence = async () => {
		const form = new FormData();
		form.append('userId', data.user.id.toString());

		await fetch('?/unsilenceUser', {
			method: 'POST',
			body: form
		});

		addNotification('User unsilenced successfully');
		data.user.silence_end = 0;
	};

	const handleWipe = async () => {
		if (!showWipeConfirm) {
			showWipeConfirm = true;
			return;
		}

		const form = new FormData();
		form.append('userId', data.user.id.toString());

		await fetch('?/wipeUser', {
			method: 'POST',
			body: form
		});

		addNotification('User data wiped successfully');
		showWipeConfirm = false;
	};

	const getPrivilegesList = () => {
		return [
			{ key: 'UNRESTRICTED', value: Privileges.UNRESTRICTED, label: 'Unrestricted' },
			{ key: 'VERIFIED', value: Privileges.VERIFIED, label: 'Verified' },
			{ key: 'WHITELISTED', value: Privileges.WHITELISTED, label: 'Whitelisted' },
			{ key: 'SUPPORTER', value: Privileges.SUPPORTER, label: 'Supporter' },
			{ key: 'PREMIUM', value: Privileges.PREMIUM, label: 'Premium' },
			{ key: 'ALUMNI', value: Privileges.ALUMNI, label: 'Alumni' },
			{ key: 'TOURNEY_MANAGER', value: Privileges.TOURNEY_MANAGER, label: 'Tourney Manager' },
			{ key: 'NOMINATOR', value: Privileges.NOMINATOR, label: 'Nominator' },
			{ key: 'MODERATOR', value: Privileges.MODERATOR, label: 'Moderator' },
			{ key: 'ADMINISTRATOR', value: Privileges.ADMINISTRATOR, label: 'Administrator' },
			{ key: 'DEVELOPER', value: Privileges.DEVELOPER, label: 'Developer' }
		];
	};

	const togglePrivilege = (privilegeValue) => {
		if (editValues['priv'] & privilegeValue) {
			editValues['priv'] &= ~privilegeValue;
		} else {
			editValues['priv'] |= privilegeValue;
		}
	};

	onMount(() => {
		EDITABLE_FIELDS.forEach((field) => {
			editValues[field.key] = data.user[field.key];
		});
	});
</script>

<div class="user-panel">
	<!-- Notification System -->
	<div class="notifications-container">
		{#each notifications as notification (notification.id)}
			<div class="notification {notification.type}" transition:slide|local animate:flip>
				{notification.message}
			</div>
		{/each}
	</div>

	<div class="user-header" transition:fade>
		<img src={avatarUrl + '/' + data.user.id} alt={data.user.name} class="user-avatar" />
		<h1 class="user-name">{data.user.name}</h1>
	</div>

	<div class="moderation-panel" transition:fade>
		<h2>Moderation Actions</h2>
		<div class="moderation-buttons">
			<button class="mod-button {isUserRestricted ? 'warning' : ''}" on:click={handleRestriction}>
				{isUserRestricted ? 'Unrestrict' : 'Restrict'} User
			</button>

			<button
				class="mod-button {isUserSilenced ? 'warning' : ''}"
				on:click={() => (isUserSilenced ? handleUnsilence() : (showSilenceModal = true))}
			>
				{isUserSilenced ? 'Unsilence' : 'Silence'} User
			</button>

			<button class="mod-button danger {showWipeConfirm ? 'confirm' : ''}" on:click={handleWipe}>
				{showWipeConfirm ? 'Confirm Wipe' : 'Wipe User'}
			</button>
		</div>
	</div>

	{#if showSilenceModal}
		<div class="modal" transition:fade>
			<div class="modal-content">
				<h2>Silence User</h2>
				<div class="form-group">
					<label for="duration">Duration (hours)</label>
					<input
						type="number"
						id="duration"
						bind:value={silenceDuration}
						min="1"
						max="720"
						class="modal-input"
					/>
				</div>
				<div class="form-group">
					<label for="reason">Reason</label>
					<textarea
						id="reason"
						bind:value={silenceReason}
						class="modal-input"
						placeholder="Provide a reason for the silence"
					></textarea>
				</div>
				<div class="button-group">
					<button class="save-button" on:click={handleSilence}>Confirm</button>
					<button class="cancel-button" on:click={() => (showSilenceModal = false)}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	<button
		class="change-password-button"
		on:click={() => (showChangePassword = true)}
		transition:fade
	>
		Change Password
	</button>

	{#if showChangePassword}
		<div class="password-modal" transition:fade>
			<div class="password-content">
				<h2>Change Password</h2>
				<form
					method="POST"
					action="?/updatePassword"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								showChangePassword = false;
								addNotification('Password updated successfully');
							} else {
								addNotification(result.error || 'Failed to update password', 'error');
							}
						};
					}}
				>
					<input type="hidden" name="userId" value={data.user.id} />
					<input
						type="password"
						name="newPassword"
						placeholder="New Password"
						required
						class="password-input"
						bind:value={confirmPassword}
					/>
					<input
						type="password"
						placeholder="Confirm Password"
						required
						class="password-input"
						bind:value={confirmPassword}
					/>
					<div class="button-group">
						<button type="submit" class="save-button" disabled={!confirmPassword}> Save </button>
						<button
							type="button"
							class="cancel-button"
							on:click={() => {
								showChangePassword = false;
								confirmPassword = '';
							}}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<div class="info-grid">
		{#each EDITABLE_FIELDS as field}
			<div class="info-item" transition:fade>
				<div class="info-header">
					<span class="info-label">{field.label}</span>
					<button class="edit-button" on:click={() => toggleEdit(field.key)}>
						{editMode[field.key] ? '✓' : '✎'}
					</button>
				</div>

				{#if editMode[field.key]}
					<form
						method="POST"
						action="?/updateUser"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') {
									data.user[field.key] = editValues[field.key];
									editMode[field.key] = false;
									addNotification(`${field.label} updated successfully`);
								} else {
									addNotification(result.error || 'Failed to update field', 'error');
								}
							};
						}}
					>
						<input type="hidden" name="userId" value={data.user.id} />
						<input type="hidden" name="field" value={field.key} />

						{#if field.type === 'textarea'}
							<textarea
								name="value"
								bind:value={editValues[field.key]}
								class="edit-input textarea"
								transition:slide
							></textarea>
						{:else}
							<input
								type="text"
								name="value"
								bind:value={editValues[field.key]}
								class="edit-input"
								transition:slide
							/>
						{/if}

						<div class="button-group">
							<button type="submit" class="save-button" disabled={!editValues[field.key]}>
								Save
							</button>
							<button type="button" class="cancel-button" on:click={() => toggleEdit(field.key)}>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<div class="info-value">
						{field.key === 'userpage_content'
							? truncateText(data.user[field.key], 50)
							: data.user[field.key]}
					</div>
				{/if}
			</div>
		{/each}

		<div class="info-item" transition:fade>
			<div class="info-header">
				<span class="info-label">Privileges</span>
				<button class="edit-button" on:click={() => toggleEdit('priv')}>
					{editMode['priv'] ? '✓' : '✎'}
				</button>
			</div>

			{#if editMode['priv']}
				<form
					method="POST"
					action="?/updateUser"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								data.user['priv'] = editValues['priv'];
								editMode['priv'] = false;
								addNotification('Privileges updated successfully');
							} else {
								addNotification(result.error || 'Failed to update field', 'error');
							}
						};
					}}
				>
					<input type="hidden" name="userId" value={data.user.id} />
					<input type="hidden" name="field" value="priv" />
					<input type="hidden" name="value" value={editValues['priv']} />

					<div class="privileges-grid">
						{#each getPrivilegesList() as privilege}
							<label class="privilege-checkbox">
								<input
									type="checkbox"
									checked={editValues['priv'] & privilege.value}
									on:change={() => togglePrivilege(privilege.value)}
								/>
								<span class="privilege-label">{privilege.label}</span>
							</label>
						{/each}
					</div>

					<div class="privilege-value">
						Current value: {editValues['priv']}
					</div>

					<div class="button-group">
						<button type="submit" class="save-button"> Save </button>
						<button type="button" class="cancel-button" on:click={() => toggleEdit('priv')}>
							Cancel
						</button>
					</div>
				</form>
			{:else}
				<div class="info-value">{formatPrivileges(data.user.priv)} ({data.user.priv})</div>
			{/if}
		</div>
		<!-- Read-only fields -->
		<div class="info-item" transition:fade>
			<span class="info-label">Member Since</span>
			<div class="info-value">{formatDate(data.user.creation_time)}</div>
		</div>

		<div class="info-item" transition:fade>
			<span class="info-label">Last Active</span>
			<div class="info-value">{formatDate(data.user.latest_activity)}</div>
		</div>

		{#if data.user.silence_end > Date.now() / 1000}
			<div class="info-item warning" transition:fade>
				<span class="info-label">Silenced Until</span>
				<div class="info-value">{formatDate(data.user.silence_end)}</div>
			</div>
		{/if}

		{#if data.user.donor_end > Date.now() / 1000}
			<div class="info-item special" transition:fade>
				<span class="info-label">Donor Status Until</span>
				<div class="info-value">{formatDate(data.user.donor_end)}</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.user-panel {
		background: #1a1a1a;
		padding: 2rem;
		border-radius: 8px;
		color: #ff3e00;
		position: relative;
	}

	.notifications-container {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.notification {
		padding: 1rem;
		border-radius: 4px;
		color: white;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		min-width: 200px;
	}

	.notification.success {
		border-left: 4px solid #4caf50;
	}

	.notification.error {
		border-left: 4px solid #f44336;
	}

	.user-header {
		display: flex;
		align-items: center;
		gap: 2rem;
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid rgba(255, 62, 0, 0.3);
	}

	.user-avatar {
		width: 128px;
		height: 128px;
		border-radius: 50%;
		border: 2px solid #ff3e00;
		transition: transform 0.3s ease;
	}

	.user-avatar:hover {
		transform: scale(1.05);
	}

	.user-name {
		font-size: 2em;
		margin: 0;
	}

	.moderation-panel {
		background: rgba(255, 62, 0, 0.05);
		padding: 1.5rem;
		border-radius: 8px;
		margin: 1rem 0;
		border: 1px solid rgba(255, 62, 0, 0.2);
	}

	.moderation-panel h2 {
		margin: 0 0 1rem 0;
		font-size: 1.5em;
		color: #ff3e00;
	}

	.moderation-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.mod-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s ease;
		background: rgba(255, 62, 0, 0.2);
		color: #ff3e00;
	}

	.mod-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 62, 0, 0.2);
		background: rgba(255, 62, 0, 0.3);
	}

	.mod-button.warning {
		background: rgba(255, 193, 7, 0.2);
		color: #ffc107;
	}

	.mod-button.danger {
		background: rgba(244, 67, 54, 0.2);
		color: #f44336;
	}

	.mod-button.confirm {
		background: #f44336;
		color: white;
		animation: pulse 1.5s infinite;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.info-item {
		background: rgba(255, 62, 0, 0.1);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid rgba(255, 62, 0, 0.3);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.info-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 62, 0, 0.2);
	}

	.info-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.info-label {
		font-size: 0.9em;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.info-value {
		font-size: 1.1em;
		word-break: break-word;
	}

	.edit-button {
		background: none;
		border: none;
		color: #ff3e00;
		cursor: pointer;
		font-size: 1.2em;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.edit-button:hover {
		background: rgba(255, 62, 0, 0.2);
		transform: scale(1.1);
	}

	.edit-input {
		width: 100%;
		background: #2a2a2a;
		border: 1px solid #ff3e00;
		color: #ff3e00;
		padding: 0.5rem;
		margin: 0.5rem 0;
		border-radius: 4px;
		transition: border-color 0.3s ease;
	}

	.edit-input:focus {
		border-color: #ff6347;
		outline: none;
		box-shadow: 0 0 0 2px rgba(255, 62, 0, 0.2);
	}

	.edit-input.textarea {
		min-height: 100px;
		resize: vertical;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.save-button,
	.cancel-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.save-button {
		background: #ff3e00;
		color: white;
	}

	.save-button:hover:not(:disabled) {
		background: #ff5722;
		transform: translateY(-1px);
	}

	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cancel-button {
		background: #2a2a2a;
		color: #ff3e00;
	}

	.cancel-button:hover {
		background: #3a3a3a;
		transform: translateY(-1px);
	}

	.warning {
		border-color: #ffd700;
		background: rgba(255, 215, 0, 0.1);
	}

	.special {
		border-color: #00ff00;
		background: rgba(0, 255, 0, 0.1);
	}

	.password-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(26, 26, 26, 0.95);
		backdrop-filter: blur(10px);
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 62, 0, 0.3);
		z-index: 1000;
	}

	.password-content {
		text-align: center;
	}

	.password-input {
		display: block;
		width: 100%;
		margin: 1rem 0;
		padding: 0.5rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 62, 0, 0.3);
		background: #2a2a2a;
		color: #ff3e00;
		transition: all 0.3s ease;
	}

	.password-input:focus {
		outline: none;
		border-color: #ff3e00;
		box-shadow: 0 0 0 2px rgba(255, 62, 0, 0.2);
	}

	.change-password-button {
		margin: 1rem 0;
		padding: 0.5rem 1rem;
		background: rgba(255, 62, 0, 0.2);
		border: 1px solid rgba(255, 62, 0, 0.3);
		border-radius: 8px;
		color: #ff3e00;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.change-password-button:hover {
		background: rgba(255, 62, 0, 0.3);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(255, 62, 0, 0.2);
	}

	.privileges-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.privilege-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 4px;
		background: rgba(255, 62, 0, 0.05);
		cursor: pointer;
		transition: background 0.2s;
	}

	.privilege-checkbox:hover {
		background: rgba(255, 62, 0, 0.1);
	}

	.privilege-checkbox input[type='checkbox'] {
		accent-color: #ff3e00;
	}

	.privilege-label {
		font-size: 0.9em;
		user-select: none;
	}

	.privilege-value {
		font-size: 0.9em;
		opacity: 0.7;
		margin: 0.5rem 0;
		text-align: center;
	}

	@media (max-width: 768px) {
		.user-header {
			flex-direction: column;
			text-align: center;
			gap: 1rem;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}

		.notifications-container {
			width: 90%;
			right: 5%;
		}
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
