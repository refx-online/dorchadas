<script lang="ts">
	import { __ } from '$lib/i18n';
	import { userLanguage } from '$lib/storage';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';
	import { avatarUrl, appName } from '$lib/env';
	import { usernameRegex } from '$lib/regex';

	export let data;

	let avatarFile: FileList;
	let coverFile: FileList;
	let bgFile: FileList;

	let newUsername = '';
	let usernameError = '';
	let message = '';
	let messageType: 'success' | 'error' = 'success';
	let isLoading = false;
	let selectedMetric = data.user.preferredMetric;

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

	function validateUsername(username: string): boolean {
		if (!username.trim()) {
			usernameError = '';
			return false;
		}
		if (!usernameRegex.test(username)) {
			usernameError = __('Invalid username format', $userLanguage);
			return false;
		}
		usernameError = '';
		return true;
	}

	function showMessage(text: string, type: 'success' | 'error' = 'success') {
		message = text;
		messageType = type;
		setTimeout(() => {
			message = '';
		}, 5000);
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
		message = '';

		try {
			const formData = new FormData();
			formData.append(fieldName, file);

			const response = await fetch(endpoint, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				showMessage(successMsg, 'success');
				await invalidateAll();
				setTimeout(() => {
					window.location.reload();
				}, 1000);
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

	async function handleAvatarUpload() {
		if (!avatarFile?.[0]) return;
		await handleImageUpload(
			avatarFile[0],
			'/settings/avatar',
			'avatar',
			__('Avatar updated successfully! Refreshing...', $userLanguage),
			__('An error occurred while uploading the avatar', $userLanguage)
		);
	}

	async function handleCoverUpload() {
		if (!coverFile?.[0]) return;
		await handleImageUpload(
			coverFile[0],
			'/settings/cover',
			'cover',
			__('Cover updated successfully! Refreshing...', $userLanguage),
			__('An error occurred while uploading the cover', $userLanguage)
		);
	}

	async function handleBackgroundUpload() {
		if (!bgFile?.[0]) return;
		await handleImageUpload(
			bgFile[0],
			'/settings/background',
			'background',
			__('Background updated successfully! Refreshing...', $userLanguage),
			__('An error occurred while uploading the background', $userLanguage)
		);
	}

	const handleUsernameSubmit: SubmitFunction = () => {
		if (!validateUsername(newUsername)) {
			return ({ result, update }) => {
				result.type = 'failure';
				update({ reset: false });
			};
		}

		message = '';
		isLoading = true;

		return async ({ result, update }) => {
			if (result.type === 'success') {
				showMessage(__('Username updated successfully', $userLanguage), 'success');
				newUsername = '';
			} else if (result.type === 'failure') {
				showMessage(
					result.data?.message || __('Failed to update username', $userLanguage),
					'error'
				);
			}
			isLoading = false;
			await update();
		};
	};

	const handleMetricSubmit: SubmitFunction = () => {
		message = '';
		isLoading = true;

		return async ({ result }) => {
			if (result.type === 'success') {
				showMessage(__('Ranking metric updated successfully', $userLanguage), 'success');
				await invalidateAll();
			} else if (result.type === 'failure') {
				showMessage(
					result.data?.message || __('Failed to update ranking metric', $userLanguage),
					'error'
				);
			}
			isLoading = false;
		};
	};

	function getPreviewUrl(file: File | undefined, defaultUrl?: string): string {
		if (file) {
			return URL.createObjectURL(file);
		}
		if (defaultUrl) {
			return `${defaultUrl}?t=${Date.now()}`;
		}
		return '';
	}
</script>

<svelte:head>
	<title>{appName} :: Settings</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
	<!-- Message Alert -->
	{#if message}
		<div
			class="alert {messageType === 'success'
				? 'variant-filled-success'
				: 'variant-filled-error'} mb-6 transition-all"
		>
			<span>{message}</span>
		</div>
	{/if}

	<div class="card p-6 md:p-8 variant-glass-surface">
		<h1 class="text-3xl font-bold mb-8">{__('Settings', $userLanguage)}</h1>

		<div class="space-y-10">
			<!-- Profile Images Section -->
			{#if data.currentUser}
				<section>
					<h2 class="text-2xl font-semibold mb-6 border-b pb-2">
						{__('Profile Images', $userLanguage)}
					</h2>

					<!-- Avatar -->
					<div class="mb-8">
						<h3 class="text-lg font-medium mb-4">{__('Avatar', $userLanguage)}</h3>
						<div class="flex flex-col md:flex-row items-start md:items-center gap-6">
							<div class="flex-shrink-0">
								<img
									src={getPreviewUrl(avatarFile?.[0], `${avatarUrl}/${data.currentUser.id}`)}
									alt="Avatar"
									class="w-32 h-32 rounded-full object-cover border-4 border-surface-300-600-token"
								/>
							</div>
							<div class="flex-1 space-y-3">
								<input
									type="file"
									accept="image/jpeg,image/png,image/gif"
									bind:files={avatarFile}
									class="input"
									disabled={isLoading}
								/>
								<button
									class="btn variant-filled-primary"
									on:click={handleAvatarUpload}
									disabled={!avatarFile?.[0] || isLoading}
								>
									{isLoading
										? __('Uploading...', $userLanguage)
										: __('Upload Avatar', $userLanguage)}
								</button>
								<p class="text-sm opacity-75">
									{__('Maximum size: 5MB. Supported formats: JPG, PNG, GIF', $userLanguage)}
								</p>
							</div>
						</div>
					</div>

					<!-- Cover Image -->
					<div class="mb-8">
						<h3 class="text-lg font-medium mb-4">{__('Cover Image', $userLanguage)}</h3>
						<div class="space-y-4">
							<div
								class="w-full h-48 overflow-hidden rounded-lg border-2 border-surface-300-600-token"
							>
								<img
									src={getPreviewUrl(coverFile?.[0], `u/${data.currentUser.id}/cover`)}
									alt="Cover"
									class="w-full h-full object-cover"
								/>
							</div>
							<div class="space-y-3">
								<input
									type="file"
									accept="image/jpeg,image/png,image/gif"
									bind:files={coverFile}
									class="input"
									disabled={isLoading}
								/>
								<button
									class="btn variant-filled-primary"
									on:click={handleCoverUpload}
									disabled={!coverFile?.[0] || isLoading}
								>
									{isLoading
										? __('Uploading...', $userLanguage)
										: __('Upload Cover', $userLanguage)}
								</button>
								<p class="text-sm opacity-75">
									{__('Maximum size: 5MB. Supported formats: JPG, PNG, GIF', $userLanguage)}
								</p>
							</div>
						</div>
					</div>

					<!-- Background Image -->
					<div>
						<h3 class="text-lg font-medium mb-4">{__('Background Image', $userLanguage)}</h3>
						<div class="space-y-4">
							<div
								class="w-full h-48 overflow-hidden rounded-lg border-2 border-surface-300-600-token"
							>
								<img
									src={getPreviewUrl(bgFile?.[0], `u/${data.currentUser.id}/background`)}
									alt="Background"
									class="w-full h-full object-cover"
								/>
							</div>
							<div class="space-y-3">
								<input
									type="file"
									accept="image/jpeg,image/png,image/gif"
									bind:files={bgFile}
									class="input"
									disabled={isLoading}
								/>
								<button
									class="btn variant-filled-primary"
									on:click={handleBackgroundUpload}
									disabled={!bgFile?.[0] || isLoading}
								>
									{isLoading
										? __('Uploading...', $userLanguage)
										: __('Upload Background', $userLanguage)}
								</button>
								<p class="text-sm opacity-75">
									{__('Maximum size: 5MB. Supported formats: JPG, PNG, GIF', $userLanguage)}
								</p>
							</div>
						</div>
					</div>
				</section>

				<!-- Account Settings Section -->
				<section>
					<h2 class="text-2xl font-semibold mb-6 border-b pb-2">
						{__('Account Settings', $userLanguage)}
					</h2>

					<!-- Clan Settings -->
					<div class="mb-8">
						<h3 class="text-lg font-medium mb-4">{__('Clan', $userLanguage)}</h3>
						<div class="flex items-center gap-4">
							{#if data.user.clanId}
								<a href="/clan/{data.user.clanId}/settings" class="btn variant-filled-secondary">
									{__('Go to Clan Settings', $userLanguage)}
								</a>
							{/if}
							<a href="/settings/invites" class="btn variant-filled-primary">
								{__('Clan Invites', $userLanguage)}
							</a>
						</div>
					</div>

					<!-- Username Change -->
					<div class="mb-8">
						<h3 class="text-lg font-medium mb-4">{__('Change Username', $userLanguage)}</h3>
						<form
							method="POST"
							action="?/changeUsername"
							use:enhance={handleUsernameSubmit}
							class="space-y-4"
						>
							<div class="space-y-2">
								<label for="new-username" class="label font-medium">
									{__('New Username', $userLanguage)}
								</label>
								<input
									type="text"
									id="new-username"
									name="newUsername"
									class="input"
									bind:value={newUsername}
									on:input={() => validateUsername(newUsername)}
									placeholder={__('Enter new username', $userLanguage)}
									disabled={isLoading}
								/>
								{#if usernameError}
									<p class="text-error-500 text-sm mt-1">{usernameError}</p>
								{/if}
							</div>
							<button
								type="submit"
								class="btn variant-filled-primary"
								disabled={!!usernameError || !newUsername || isLoading}
							>
								{isLoading
									? __('Updating...', $userLanguage)
									: __('Change Username', $userLanguage)}
							</button>
						</form>
					</div>

					<!-- Ranking Metric -->
					<div>
						<h3 class="text-lg font-medium mb-4">{__('Ranking Metric', $userLanguage)}</h3>
						<form
							method="POST"
							action="?/changeMetric"
							use:enhance={handleMetricSubmit}
							class="space-y-4"
						>
							<div class="space-y-2">
								<label for="preferred-metric" class="label font-medium">
									{__('Preferred Ranking Metric', $userLanguage)}
								</label>
								<select
									id="preferred-metric"
									name="preferredMetric"
									class="select"
									bind:value={selectedMetric}
									disabled={isLoading}
								>
									<option value="pp">{__('Performance Points (PP)', $userLanguage)}</option>
									<option value="score">{__('Score', $userLanguage)}</option>
								</select>
								<p class="text-sm opacity-75">
									{__('Choose your ranking metric for ingame leaderboard', $userLanguage)}
								</p>
							</div>
							<button type="submit" class="btn variant-filled-primary" disabled={isLoading}>
								{isLoading
									? __('Updating...', $userLanguage)
									: __('Update Ranking Metric', $userLanguage)}
							</button>
						</form>
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>
