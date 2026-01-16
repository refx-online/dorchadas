<script lang="ts">
	import { page } from '$app/stores';
	import { __, languages } from '$lib/language';
	import { userData, userLanguage } from '$lib/storage';
	import { Avatar, type DrawerStore } from '@skeletonlabs/skeleton';
	import Popup from './Popup.svelte';
	import { avatarUrl } from '$lib/env';
	import { goto } from '$app/navigation';
	import { githubUrl } from '$lib/env';

	export let drawerStore: DrawerStore;

	const downloadsPages = ['/patcher', '/lazer', '/client'];
	$: isDownloadsActive = downloadsPages.includes($page.data.url);
</script>

<div class="flex flex-col md:flex-row p-3 md:p-0 gap-2 h-full w-full">
	<div class="md:hidden ms-auto">
		<Popup event="click" placement="bottom">
			<Avatar
				src="{avatarUrl}/{$userData?.id ?? 0}"
				class="!w-10 select-none cursor-pointer hover:ring hover:ring-surface-600 transition-all"
			/>
			<svelte:fragment slot="popup">
				<div class="card p-4 variant-filled-surface">
					<div class="flex flex-col gap-2">
						{#if $userData}
							<button
								class="w-32 btn variant-filled-surface rounded-lg"
								on:click={() => {
									goto(`/u/${$userData?.id}`);
									drawerStore.close();
								}}>{__('Profile', $userLanguage)}</button
							>
							<button
								class="w-32 btn variant-filled-surface rounded-lg"
								on:click={() => {
									goto(`/settings`);
									drawerStore.close();
								}}>{__('Settings', $userLanguage)}</button
							>
							<button
								class="w-32 btn variant-filled-surface rounded-lg"
								on:click={() => {
									goto(`/friends`);
									drawerStore.close();
								}}>{__('Friends', $userLanguage)}</button
							>
							<a class="w-32 btn variant-filled-surface rounded-lg" href="/logout"
								>{__('Logout', $userLanguage)}</a
							>
						{:else}
							<button
								class="w-32 btn variant-filled-surface rounded-lg"
								on:click={() => {
									goto('/signin');
									drawerStore.close();
								}}>{__('Sign In', $userLanguage)}</button
							>
							<button
								class="w-32 btn variant-filled-surface rounded-lg"
								on:click={() => {
									goto('/signup');
									drawerStore.close();
								}}>{__('Sign Up', $userLanguage)}</button
							>
						{/if}
					</div>
					<div
						class="arrow variant-filled-surface border-t border-l border-gray-700 !right-[0px]"
					/>
				</div>
			</svelte:fragment>
		</Popup>
	</div>
	<a
		href="/leaderboards"
		class="btn {$page.data.url == '/leaderboards'
			? 'variant-ghost-surface '
			: 'hover:variant-outline-surface '}rounded-lg"
		on:click={() => drawerStore.close()}
	>
		{__('Leaderboards', $userLanguage)}
	</a>

	<a
		href="/clans"
		class="btn {$page.data.url == '/clans'
			? 'variant-ghost-surface '
			: 'hover:variant-outline-surface '}rounded-lg"
		on:click={() => drawerStore.close()}
	>
		{__('Clans', $userLanguage)}
	</a>

	<div class="hidden md:block">
		<Popup event="click" placement="bottom">
			<button
				class="btn {isDownloadsActive
					? 'variant-ghost-surface '
					: 'hover:variant-outline-surface '}rounded-lg"
			>
				{__('Play', $userLanguage)}
				<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			<svelte:fragment slot="popup">
				<div class="card p-2 variant-filled-surface">
					<div class="flex flex-col gap-1">
						<a
							href="/patcher"
							class="btn {$page.data.url == '/patcher'
								? 'variant-ghost-surface '
								: 'hover:variant-outline-surface '}rounded-lg justify-start"
							on:click={() => drawerStore.close()}
						>
							{__('Patcher', $userLanguage)}
						</a>
						<a
							href="/lazer"
							class="btn {$page.data.url == '/lazer'
								? 'variant-ghost-surface '
								: 'hover:variant-outline-surface '}rounded-lg justify-start"
							on:click={() => drawerStore.close()}
						>
							{__('Lazer', $userLanguage)}
						</a>
						<a
							href="/client"
							class="btn {$page.data.url == '/client'
								? 'variant-ghost-surface '
								: 'hover:variant-outline-surface '}rounded-lg justify-start"
							on:click={() => drawerStore.close()}
						>
							{__('re;fx Client', $userLanguage)}
						</a>
					</div>
					<div class="arrow variant-filled-surface border-t border-l border-gray-700" />
				</div>
			</svelte:fragment>
		</Popup>
	</div>

	<div class="md:hidden flex flex-col gap-2 w-full">
		<a
			href="/patcher"
			class="btn {$page.data.url == '/patcher'
				? 'variant-ghost-surface '
				: 'hover:variant-outline-surface '}rounded-lg"
			on:click={() => drawerStore.close()}
		>
			{__('Patcher', $userLanguage)}
		</a>

		<a
			href="/lazer"
			class="btn {$page.data.url == '/lazer'
				? 'variant-ghost-surface '
				: 'hover:variant-outline-surface '}rounded-lg"
			on:click={() => drawerStore.close()}
		>
			{__('Lazer', $userLanguage)}
		</a>

		<a
			href="/client"
			class="btn {$page.data.url == '/client'
				? 'variant-ghost-surface '
				: 'hover:variant-outline-surface '}rounded-lg"
			on:click={() => drawerStore.close()}
		>
			{__('re;fx Client', $userLanguage)}
		</a>
	</div>

	<a
		href="/rules"
		class="btn {$page.data.url == '/rules'
			? 'variant-ghost-surface '
			: 'hover:variant-outline-surface '}rounded-lg"
		on:click={() => drawerStore.close()}
	>
		{__('Rules', $userLanguage)}
	</a>

	<a
		href="/top"
		class="btn {$page.data.url == '/top'
			? 'variant-ghost-surface '
			: 'hover:variant-outline-surface '}rounded-lg"
		on:click={() => drawerStore.close()}
	>
		{__('Top Plays', $userLanguage)}
	</a>

	<div class="h-full w-full flex flex-row justify-between items-end mt-auto">
		<div class="md:hidden ms-auto">
			<Popup event="click" placement="bottom">
				<button class="btn px-2 py-2 rounded-lg variant-ghost-surface">
					<img
						width="30"
						class="pointer-events-none"
						src="/flags/{$userLanguage}.png"
						alt="language"
					/>
				</button>
				<svelte:fragment slot="popup">
					<div class="flex flex-col gap-2 card variant-filled-surface p-2 rounded-lg">
						{#each languages as lang}
							<button
								class="flex flex-row items-center {$userLanguage == lang.code
									? 'bg-primary-600/30'
									: 'bg-surface-600 hover:bg-surface-700'} hover:scale-[1.005] active:scale-[0.995] transition-all px-6 py-2 rounded-lg cursor-pointer"
								on:click={() => userLanguage.set(lang.code)}
							>
								<img width="30" src="/flags/{lang.code}.png" alt="flag-{lang.code}" class="mr-2" />
								{lang.name}
							</button>
						{/each}
					</div>
				</svelte:fragment>
			</Popup>
		</div>
	</div>
</div>
