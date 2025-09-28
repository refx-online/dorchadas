<script lang="ts">
    import { __ } from '$lib/language';
    import { userLanguage } from '$lib/storage';
    import { languages } from '$lib/language';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import { invalidateAll } from '$app/navigation';
    import { avatarUrl } from '$lib/env';
    import { usernameRegex } from '$lib/regex';
    import { page } from '$app/stores';
    import { appName } from '$lib/env';

    export let data;

    let avatarFile: FileList;
    let coverFile: FileList;
    let bgFile: FileList;

    let newUsername = '';
    let usernameError = '';
    let message = '';
    let isLoading = false;
    let selectedMetric = data.user.preferredMetric;

    function validateUsername(username: string) {
        if (!usernameRegex.test(username)) {
            usernameError = __('Invalid username format', $userLanguage);
            return false;
        }
        usernameError = '';
        return true;
    }

    async function handleAvatarUpload() {
        if (!avatarFile?.[0]) return;
        isLoading = true;
        message = '';

        try {
            const formData = new FormData();
            formData.append('avatar', avatarFile[0]);

            const response = await fetch('/settings/avatar', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                message = __('Avatar updated successfully, ctrl + f5 to reload', $userLanguage);
                await invalidateAll();
            } else {
                message = __('An error occurred while uploading the avatar', $userLanguage);
            }
        } catch (err) {
            message = __('An error occurred while uploading the avatar', $userLanguage);
        } finally {
            isLoading = false;
        }
    }

    async function handleCoverUpload() {
        if (!coverFile?.[0]) return;
        isLoading = true;
        message = '';

        try {
            const formData = new FormData();
            formData.append('cover', coverFile[0]);

            const response = await fetch('/settings/cover', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                message = __('Cover updated successfully, ctrl + f5 to reload', $userLanguage);
                await invalidateAll();
            } else {
                message = __('An error occurred while uploading the cover', $userLanguage);
            }
        } catch (err) {
            message = __('An error occurred while uploading the cover', $userLanguage);
        } finally {
            isLoading = false;
        }
    }

    async function handleBackgroundUpload() {
        if (!bgFile?.[0]) return;
        isLoading = true;
        message = '';

        try {
            const formData = new FormData();
            formData.append('background', bgFile[0]);

            const response = await fetch('/settings/background', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                message = __('Background updated successfully, ctrl + f5 to reload', $userLanguage);
                await invalidateAll();
            } else {
                message = __('An error occurred while uploading the background', $userLanguage);
            }
        } catch (err) {
            message = __('An error occurred while uploading the background', $userLanguage);
        } finally {
            isLoading = false;
        }
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
                message = __('Username updated successfully', $userLanguage);
                newUsername = '';
            } else if (result.type === 'failure') {
                message = result.data?.message || __('Failed to update username', $userLanguage);
            }

            isLoading = false;
            await update();
        };
    };

    const handleMetricSubmit: SubmitFunction = () => {
        message = '';
        isLoading = true;

        return async ({ result, update }) => {
            if (result.type === 'success') {
                message = __('Ranking metric updated successfully', $userLanguage);
                await invalidateAll();
            } else if (result.type === 'failure') {
                message = result.data?.message || __('Failed to update ranking metric', $userLanguage);
            }

            isLoading = false;
        };
    };
</script>

<svelte:head>
	<title>{appName} :: Settings</title>
</svelte:head>

{#if message}
    <div class="alert {message.includes('success') ? 'variant-filled-success' : 'variant-filled-error'} mb-4">
        {message}
    </div>
{/if}

<div class="container mx-auto p-4">
    <div class="card p-6 variant-glass-surface">
        <h1 class="text-2xl font-bold mb-6">{__('Settings', $userLanguage)}</h1>

        <div class="space-y-6">
            <!-- Avatar Settings and cover -->
            {#if data.currentUser}
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold">{__('Avatar', $userLanguage)}</h2>
                    <div class="flex items-center space-x-4">

                        <img
                            src={avatarUrl && avatarUrl + '/' + data.currentUser.id}
                            alt="Avatar"
                            class="w-24 h-24 rounded-full object-cover"
                            style="display: {avatarFile ? 'none' : 'block'};"
                        />

                        {#if avatarFile}
                            <img
                                src={URL.createObjectURL(avatarFile[0])}
                                alt="Selected Avatar Preview"
                                class="w-24 h-24 rounded-full object-cover"
                            />
                        {/if}
                        <div class="space-y-2">
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                bind:files={avatarFile}
                                class="input"
                            />
                            <button
                                class="btn variant-filled-primary"
                                on:click={handleAvatarUpload}
                                disabled={!avatarFile?.[0]}
                            >
                                {__('Upload Avatar', $userLanguage)}
                            </button>
                            <p class="text-sm">
                                {__('maximum size: 5MB. supported formats: JPG, PNG', $userLanguage)}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold">{__('Cover Image', $userLanguage)}</h2>
                    <div class="flex items-center space-x-4">

                        <img
                            src={"u/" + data.currentUser.id + "/cover"}
                            alt="Cover"
                            class="w-24 h-24 object-cover"
                            style="display: {coverFile ? 'none' : 'block'};"
                        />

                        {#if coverFile}
                            <img
                                src={URL.createObjectURL(coverFile[0])}
                                alt="Selected Cover Preview"
                                class="w-full h-32 object-cover"
                            />
                        {/if}
                        <div class="space-y-2">
                            <input
                                type="file"
                                accept="image/jpeg,image/png"
                                bind:files={coverFile}
                                class="input"
                            />
                            <button
                                class="btn variant-filled-primary"
                                on:click={handleCoverUpload}
                                disabled={!coverFile?.[0]}
                            >
                                {__('Upload Cover', $userLanguage)}
                            </button>
                            <p class="text-sm">
                                {__('maximum size: 5MB. supported formats: JPG, PNG', $userLanguage)}
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Background -->
            {#if data.currentUser}
            <div class="space-y-4">
                <h2 class="text-xl font-semibold">{__('Background Image', $userLanguage)}</h2>
                <div class="flex items-center space-x-4">

                    <img
                        src={"u/" + data.currentUser.id + "/background"}
                        alt="bg"
                        class="w-24 h-24 object-cover"
                        style="display: {bgFile ? 'none' : 'block'};"
                    />

                    {#if bgFile}
                        <img
                            src={URL.createObjectURL(bgFile[0])}
                            alt="Selected Background Preview"
                            class="w-full h-32 object-cover"
                        />
                    {/if}
                    <div class="space-y-2">
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            bind:files={bgFile}
                            class="input"
                        />
                        <button
                            class="btn variant-filled-primary"
                            on:click={handleBackgroundUpload}
                            disabled={!bgFile?.[0]}
                        >
                            {__('Upload Background', $userLanguage)}
                        </button>
                        <p class="text-sm">
                            {__('maximum size: 5MB. supported formats: JPG, PNG', $userLanguage)}
                        </p>
                    </div>
                </div>
            </div>
            {/if}

            <!-- Username Change -->
            {#if data.currentUser}
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold">{__('Change Username', $userLanguage)}</h2>
                    <form
                        method="POST"
                        action="?/changeUsername"
                        use:enhance={handleUsernameSubmit}
                        class="space-y-4"
                    >
                    <input type="hidden"/>
                        <div class="space-y-2">
                            <label for="new-username" class="label">
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
                            />
                            {#if usernameError}
                                <p class="text-error-500 text-sm">{usernameError}</p>
                            {/if}
                        </div>
                        <button
                            type="submit"
                            class="btn variant-filled-primary"
                            disabled={!!usernameError || !newUsername}
                        >
                            {__('Change Username', $userLanguage)}
                        </button>
                    </form>
                </div>
            {/if}

            <!-- Ranking Metric -->
            {#if data.currentUser}
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold">{__('Ranking Metric', $userLanguage)}</h2>
                    <form
                        method="POST"
                        action="?/changeMetric"
                        use:enhance={handleMetricSubmit}
                        class="space-y-4"
                    >
                        <div class="space-y-2">
                            <label for="preferred-metric" class="label">
                                {__('Preferred Ranking Metric', $userLanguage)}
                            </label>
                            <select
                                id="preferred-metric"
                                name="preferredMetric"
                                class="select"
                                bind:value={selectedMetric}
                            >
                                <option value="pp">{__('Performance Points (PP)', $userLanguage)}</option>
                                <option value="score">{__('Score', $userLanguage)}</option>
                            </select>
                            <p class="text-sm opacity-75">
                                {__('Choose your ranking metric for ingame leaderboard', $userLanguage)}
                            </p>
                        </div>
                        <button
                            type="submit"
                            class="btn variant-filled-primary"
                        >
                            {__('Update Ranking Metric', $userLanguage)}
                        </button>
                    </form>
                </div>
            {/if}

            <!-- Password Change -->
            <!--{#if data.currentUser}
                <div class="space-y-4">
                    <h2 class="text-xl font-semibold">{__('Change Password', $userLanguage)}</h2>
                    <form method="POST" action="?/updateProfile" use:enhance={handleSubmit} class="space-y-4">
                        <div class="space-y-2">
                            <label for="current-password" class="label">
                                {__('Current Password', $userLanguage)}
                            </label>
                            <input
                                type="password"
                                id="current-password"
                                name="currentPassword"
                                class="input"
                                placeholder="********"
                            />
                        </div>

                        <div class="space-y-2">
                            <label for="new-password" class="label">
                                {__('New Password', $userLanguage)}
                            </label>
                            <input
                                type="password"
                                id="new-password"
                                name="newPassword"
                                class="input"
                                placeholder="********"
                            />
                        </div>

                        <button type="submit" class="btn variant-filled-primary">
                            {__('Save Changes', $userLanguage)}
                        </button>
                    </form>
                </div>
            {/if}
            -->
        </div>
    </div>
</div>