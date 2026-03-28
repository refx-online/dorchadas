<script lang="ts">
	import './style.postcss';
	import { enhance } from '$app/forms';
	import { avatarUrl } from '$lib/env';
	import { onMount } from 'svelte';
	import { Privileges } from '$lib/privs';
	import { fade, slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { invalidateAll } from '$app/navigation';
	import type { DBUser } from '$lib/types';

	export let data: { user: DBUser };

	let editMode: { [key: string]: boolean } = {};
	let editValues: { [key: string]: any } = {};

	let showChangePassword = false;
	let showWipeConfirm = false;
	let showSilenceModal = false;
	let silenceDuration = 1; // Default 1 hour
	let silenceReason = '';
	let confirmPassword = '';

	let notifications: Array<{ id: number; message: string; type: 'success' | 'error' }> = [];
	let notificationCount = 0;

	const EDITABLE_FIELDS: Array<{ key: keyof DBUser; label: string; type?: string }> = [
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

	const formatPrivileges = (priv: number) => {
		const privileges = Object.entries(Privileges)
			.filter(([_, flag]) => (priv & (flag as number)) !== 0)
			.map(([name]) => name);
		return privileges.length > 0 ? privileges.join(', ') : 'None';
	};

	const toggleEdit = (field: string) => {
		editMode[field] = !editMode[field];
		if (editMode[field]) {
			editValues[field] = (data.user as any)[field];
		} else {
			editValues[field] = '';
		}
	};

	const truncateText = (text: string | null, limit: number) => {
		if (text === null) return '';

		return text.length > limit ? text.slice(0, limit) + '...' : text;
	};

	function getFieldValue(user: DBUser, key: keyof DBUser) {
		return user[key];
	}

	function getFieldValueAsString(user: DBUser, key: keyof DBUser): string {
		return (user[key] as any) || '';
	}

	$: isUserRestricted = data.user ? !(data.user.priv & 1) : false;
	$: isUserSilenced = data.user ? data.user.silence_end > Date.now() / 1000 : false;

	function handleUpdatePasswordResult(result: any) {
		if (result.type === 'success') {
			showChangePassword = false;
			addNotification('Password updated successfully');
		} else if (result.type === 'error' || result.type === 'failure') {
			const errorData: any = result.type === 'failure' ? result.data : undefined;
			const errorMessage = errorData?.error || 'Failed to update password';
			addNotification(errorMessage, 'error');
		}
	}

	function handleUpdateUserResult(result: any, fieldKey: string, fieldLabel: string) {
		if (result.type === 'success') {
			if (fieldKey === 'priv') {
				data.user.priv = Number(editValues['priv']);
			} else {
				(data.user as any)[fieldKey] = editValues[fieldKey];
			}
			editMode[fieldKey] = false;
			addNotification(`${fieldLabel} updated successfully`);
		} else if (result.type === 'error' || result.type === 'failure') {
			const errorData: any = result.type === 'failure' ? result.data : undefined;
			const errorMessage = errorData?.error || 'Failed to update field';
			addNotification(errorMessage, 'error');
		}
	}

	// Action Handlers
	const handleRestriction = async () => {
		if (!data.user) return;
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
		if (!data.user) return;
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
		await invalidateAll();
	};

	const handleUnsilence = async () => {
		if (!data.user) return;
		const form = new FormData();
		form.append('userId', data.user.id.toString());

		await fetch('?/unsilenceUser', {
			method: 'POST',
			body: form
		});

		addNotification('User unsilenced successfully');
		data.user.silence_end = 0;
		await invalidateAll();
	};

	const handleWipe = async () => {
		if (!data.user) return;
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
		await invalidateAll();
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

	const togglePrivilege = (privilegeValue: number) => {
		if (editValues['priv'] & privilegeValue) {
			editValues['priv'] &= ~privilegeValue;
		} else {
			editValues['priv'] |= privilegeValue;
		}
	};

	onMount(() => {
		if (data.user) {
			EDITABLE_FIELDS.forEach((field) => {
				editValues[field.key] = (data.user as any)[field.key];
			});
			editValues['priv'] = data.user.priv;
		}
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

	{#if data.user}
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
						<button class="cancel-button" on:click={() => (showSilenceModal = false)}>Cancel</button
						>
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
								handleUpdatePasswordResult(result);
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
									handleUpdateUserResult(result, field.key, field.label);
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
							{#if field.key === 'userpage_content'}
								{truncateText(getFieldValueAsString(data.user, field.key), 50)}
							{:else}
								{getFieldValue(data.user, field.key)}
							{/if}
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
								handleUpdateUserResult(result, 'priv', 'Privileges');
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
										checked={!!(editValues['priv'] & privilege.value)}
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
	{:else}
		<div class="error-container">
			<h1>User not found or insufficient privileges</h1>
		</div>
	{/if}
</div>
