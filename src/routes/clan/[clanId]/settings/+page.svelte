<script lang="ts">
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import { invalidateAll } from '$app/navigation';
	import { appName } from '$lib/env';

	export let data;

	let flagFile: FileList;
	let message = '';
	let messageType: 'success' | 'error' = 'success';
	let isLoading = false;
	let clanName = data.clan.name;
	let clanTag = data.clan.tag;
	let inviteUsername = '';

	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
	const MAX_SIZE = 5 * 1024 * 1024; // 5MB

	function validateFile(file: File | undefined): { valid: boolean; error?: string } {
		if (!file) return { valid: false };

		if (!ALLOWED_TYPES.includes(file.type)) {
			return {
				valid: false,
				error: __('Invalid file type. Only JPG, PNG, and GIF are allowed.', $userLanguage)
			};
		}

		if (file.size > MAX_SIZE) {
			return {
				valid: false,
				error: __('File size exceeds 5MB limit', $userLanguage)
			};
		}

		return { valid: true };
	}

	function showMessage(text: string, type: 'success' | 'error') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
		}, 5000);
	}

	function getPreviewUrl(file: File | undefined, fallback: string): string {
		if (file) {
			return URL.createObjectURL(file);
		}
		return fallback;
	}

	async function handleImageUpload(
		file: File,
		endpoint: string,
		fieldName: string,
		successMsg: string,
		errorMsg: string
	) {
		const validation = validateFile(file);
		if (!validation.valid) {
			showMessage(validation.error || errorMsg, 'error');
			return;
		}

		isLoading = true;
		const formData = new FormData();
		formData.append(fieldName, file);

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				showMessage(successMsg, 'success');
				await invalidateAll();
				if (flagFile) flagFile = null as unknown as FileList;
			} else {
				const result = await response.json();
				showMessage(result.message || errorMsg, 'error');
			}
		} catch {
			showMessage(errorMsg, 'error');
		} finally {
			isLoading = false;
		}
	}

	async function handleFlagUpload() {
		if (!flagFile?.[0]) return;
		await handleImageUpload(
			flagFile[0],
			`/clan/${data.clan.id}/settings/flag`,
			'flag',
			__('Flag updated successfully! Refreshing...', $userLanguage),
			__('An error occurred while uploading the flag', $userLanguage)
		);
	}

	async function handleSettingsUpdate() {
		isLoading = true;
		try {
			const response = await fetch(`/clan/${data.clan.id}/settings/update`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: clanName,
					tag: clanTag
				})
			});

			if (response.ok) {
				showMessage(__('Settings updated successfully!', $userLanguage), 'success');
				await invalidateAll();
			} else {
				const result = await response.json();
				showMessage(result.message || __('Failed to update settings', $userLanguage), 'error');
			}
		} catch {
			showMessage(__('An error occurred while updating settings', $userLanguage), 'error');
		} finally {
			isLoading = false;
		}
	}

	async function handleInvite() {
		if (!inviteUsername) return;
		isLoading = true;
		try {
			const response = await fetch(`/clan/${data.clan.id}/settings/invite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: inviteUsername
				})
			});

			if (response.ok) {
				showMessage(__('Invite sent successfully!', $userLanguage), 'success');
				inviteUsername = '';
				await invalidateAll();
			} else {
				const result = await response.json();
				showMessage(result.message || __('Failed to send invite', $userLanguage), 'error');
			}
		} catch {
			showMessage(__('An error occurred while sending invite', $userLanguage), 'error');
		} finally {
			isLoading = false;
		}
	}

	async function handleCancelInvite(inviteId: number) {
		isLoading = true;
		try {
			const response = await fetch(`/clan/${data.clan.id}/settings/invites/cancel`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					inviteId
				})
			});

			if (response.ok) {
				showMessage(__('Invite cancelled successfully!', $userLanguage), 'success');
				await invalidateAll();
			} else {
				const result = await response.json();
				showMessage(result.message || __('Failed to cancel invite', $userLanguage), 'error');
			}
		} catch {
			showMessage(__('An error occurred while cancelling invite', $userLanguage), 'error');
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{appName} :: {data.clan.name} settings</title>
</svelte:head>

<div class="container h-full mx-auto flex justify-center items-center py-10 px-4">
	<div class="card p-6 w-full max-w-4xl shadow-xl bg-surface-800">
		<header class="mb-8 flex justify-between items-center">
			<h2 class="h2">{data.clan.name} {__('Settings', $userLanguage)}</h2>
			<a href="/clan/{data.clan.id}" class="btn variant-soft">
				{__('Back to Profile', $userLanguage)}
			</a>
		</header>

		{#if message}
			<div
				class="alert mb-6 {messageType === 'success' ? 'variant-filled-success' : 'variant-filled-error'}"
			>
				<p>{message}</p>
			</div>
		{/if}

		<div class="grid grid-cols-1 gap-8">
			<div class="card p-4 variant-soft">
				<h3 class="h3 mb-4">{__('General Info', $userLanguage)}</h3>

				<div class="space-y-8">
					<div class="mb-8 space-y-4">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<label class="label">
								<span>{__('Clan Name', $userLanguage)}</span>
								<input
									type="text"
									class="input"
									bind:value={clanName}
									placeholder={__('Enter clan name', $userLanguage)}
									disabled={isLoading}
								/>
							</label>
							<label class="label">
								<span>{__('Clan Tag', $userLanguage)}</span>
								<input
									type="text"
									class="input"
									bind:value={clanTag}
									placeholder={__('Enter clan tag', $userLanguage)}
									disabled={isLoading}
								/>
							</label>
						</div>
						<button
							class="btn variant-filled-primary"
							on:click={handleSettingsUpdate}
							disabled={isLoading || (clanName === data.clan.name && clanTag === data.clan.tag)}
						>
							{isLoading ? __('Saving...', $userLanguage) : __('Save Settings', $userLanguage)}
						</button>
					</div>

					<hr class="opacity-25" />

					<div class="mb-8 space-y-4">
						<h3 class="text-lg font-medium">{__('Invite Users', $userLanguage)}</h3>
						<div class="flex gap-4">
							<input
								type="text"
								class="input"
								bind:value={inviteUsername}
								placeholder={__('Enter username to invite', $userLanguage)}
								disabled={isLoading}
							/>
							<button
								class="btn variant-filled-primary"
								on:click={handleInvite}
								disabled={isLoading || !inviteUsername}
							>
								{__('Invite', $userLanguage)}
							</button>
						</div>

						{#if data.invites && data.invites.length > 0}
							<div class="mt-4">
								<h4 class="h4 mb-2">{__('Pending Invites', $userLanguage)}</h4>
								<div class="table-container">
									<table class="table table-hover">
										<thead>
											<tr>
												<th>{__('Username', $userLanguage)}</th>
												<th>{__('Status', $userLanguage)}</th>
												<th>{__('Action', $userLanguage)}</th>
											</tr>
										</thead>
										<tbody>
											{#each data.invites as invite}
												<tr>
													<td>{invite.username}</td>
													<td><span class="chip variant-soft-warning">{invite.status}</span></td>
													<td>
														<button
															class="btn btn-sm variant-filled-error"
															on:click={() => handleCancelInvite(invite.id)}
															disabled={isLoading}
														>
															{__('Cancel', $userLanguage)}
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>

					<hr class="opacity-25" />

					<div class="mb-8">
						<h3 class="text-lg font-medium mb-4">{__('Clan Flag', $userLanguage)}</h3>
						<div class="flex flex-col md:flex-row gap-6 items-start">
							<div class="flex-shrink-0">
								<img
									src={getPreviewUrl(flagFile?.[0], `/api/clan/${data.clan.id}/flag`)}
									alt="Flag"
									class="h-16 aspect-[3/2] rounded-md object-cover border-4 border-surface-300-600-token"
									on:error={(e) => {
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
							<div class="flex-1 space-y-3">
								<input
									type="file"
									accept="image/jpeg,image/png,image/gif"
									bind:files={flagFile}
									class="input"
									disabled={isLoading}
								/>
								<button
									class="btn variant-filled-primary"
									on:click={handleFlagUpload}
									disabled={!flagFile?.[0] || isLoading}
								>
									{isLoading
										? __('Uploading...', $userLanguage)
										: __('Upload Flag', $userLanguage)}
								</button>
								<p class="text-sm opacity-75">
									{__('Maximum size: 5MB. Supported formats: JPG, PNG, GIF', $userLanguage)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>