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
			<!-- Media Settings -->
			<div class="card p-4 variant-soft">
				<h3 class="h3 mb-4">{__('Appearance', $userLanguage)}</h3>

				<div class="space-y-8">
					<!-- Flag Image -->
					<div class="mb-8">
						<h3 class="text-lg font-medium mb-4">{__('Clan Flag', $userLanguage)}</h3>
						<div class="flex flex-col md:flex-row gap-6 items-start">
							<div class="flex-shrink-0">
								<img
									src={getPreviewUrl(flagFile?.[0], `/api/clan/${data.clan.id}/flag`)}
									alt="Flag"
									class="h-16 w-16 md:w-auto md:h-16 rounded object-cover border-4 border-surface-300-600-token"
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