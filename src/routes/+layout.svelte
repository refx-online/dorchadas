<script lang="ts">
	import '../app.postcss';
	import './style.postcss';
	import {
		AppShell,
		Avatar,
		Toast,
		initializeStores,
		Drawer,
		getDrawerStore,
		focusTrap
	} from '@skeletonlabs/skeleton';
	import { BarLoader } from 'svelte-loading-spinners';

	// Highlight JS
	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	storeHighlightJs.set(hljs);

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import { fade, fly, scale } from 'svelte/transition';
	import { navigating, page } from '$app/stores';
	import { userData, userLanguage } from '$lib/storage';
	import { onMount } from 'svelte';
	import { appName, avatarUrl, apiUrl } from '$lib/env';
	import Menu from 'svelte-feathers/Menu.svelte';
	import Search from 'svelte-feathers/Search.svelte';
	import Heart from 'svelte-feathers/Heart.svelte';
	import NavItems from '$lib/components/navItems.svelte';
	import type { UserData } from '$lib/types';
	import Popup from '$lib/components/Popup.svelte';
	import { __, languages } from '$lib/language';
	import Footer from '$lib/components/footer.svelte';
	import { elasticOut } from 'svelte/easing';
	import { isRestricted } from '$lib/privs';
	import { discordUrl } from '$lib/env';

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	initializeStores();

	const drawerStore = getDrawerStore();

	export let data;

	if ('currentUser' in data) {
		userData.set(data.currentUser as UserData);
	} else {
		userData.set(undefined);
	}

	let showStickyNav = false;

	let userSearchResults: { id: number; name: string }[] = [];
	let userSearchQuery = '';
	let userSearchTimeout: any;

	const searchUsers = async () => {
		if (userSearchTimeout) clearTimeout(userSearchTimeout);

		if (userSearchQuery.length <= 2) {
			userSearchResults = [];
			return;
		}

		userSearchTimeout = setTimeout(async () => {
			try {
				const url = `${apiUrl}/v1/search_players?q=${userSearchQuery}`;
				const response = await fetch(url, {
					method: 'GET'
				});
				if (response.ok) {
					const json = await response.json();
					userSearchResults = json.result;
				} else {
					userSearchResults = [];
				}
			} catch {
				userSearchResults = [];
			}
		}, 500);
	};

	// nerv's
	let hoveredIndex = -1;
	const nervNavItems = [
		{ title: 'Nerv', icon: '⏾', path: '/nerv', description: 'Dashboard' },
		{ title: 'Ranking', icon: '🎵', path: '/nerv/beatmaps', description: 'Beatmap Ranking' }
	];

	function getRandomOffset() {
		return (Math.random() - 0.5) * 20;
	}

	$: isNervPath = $page.url.pathname.startsWith('/nerv');

	onMount(() => {
		// Automate CSRF token injection
		const getCsrfToken = () => {
			return document.cookie
				.split('; ')
				.find((row) => row.startsWith('csrf_token='))
				?.split('=')[1];
		};

		const isSameOrigin = (url: string | URL | Request) => {
			try {
				const target =
					url instanceof Request ? url.url : typeof url === 'string' ? url : url.toString();
				if (target.startsWith('/') || target.startsWith(window.location.origin)) {
					return true;
				}
				const targetUrl = new URL(target, window.location.origin);
				return targetUrl.origin === window.location.origin;
			} catch {
				return false;
			}
		};

		const originalFetch = window.fetch;
		window.fetch = async (input, init) => {
			let method = 'GET';
			if (input instanceof Request) {
				method = input.method.toUpperCase();
			} else if (init?.method) {
				method = init.method.toUpperCase();
			}

			const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

			if (stateChangingMethods.includes(method) && isSameOrigin(input)) {
				const csrfToken = getCsrfToken();
				if (csrfToken) {
					if (input instanceof Request) {
						if (!input.headers.has('X-CSRF-Token')) {
							input.headers.set('X-CSRF-Token', csrfToken);
						}
					} else {
						init = init || {};
						init.headers = init.headers || {};

						if (init.headers instanceof Headers) {
							if (!init.headers.has('X-CSRF-Token')) {
								init.headers.set('X-CSRF-Token', csrfToken);
							}
						} else if (Array.isArray(init.headers)) {
							if (!init.headers.some(([key]) => key.toLowerCase() === 'x-csrf-token')) {
								init.headers.push(['X-CSRF-Token', csrfToken]);
							}
						} else {
							if (!init.headers['X-CSRF-Token'] && !init.headers['x-csrf-token']) {
								init.headers['X-CSRF-Token'] = csrfToken;
							}
						}
					}
				}
			}
			return originalFetch(input, init);
		};

		window.addEventListener('submit', (event) => {
			const form = event.target as HTMLFormElement;
			const method = form.method.toUpperCase();
			const action = form.getAttribute('action') || '';
			const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

			if (stateChangingMethods.includes(method) && isSameOrigin(action)) {
				const csrfToken = getCsrfToken();
				if (csrfToken && !form.querySelector('input[name="csrf_token"]')) {
					const input = document.createElement('input');
					input.type = 'hidden';
					input.name = 'csrf_token';
					input.value = csrfToken;
					form.appendChild(input);
				}
			}
		});

		const pageMain = document.getElementById('page');
		if (pageMain) {
			showStickyNav = pageMain.scrollTop > 100;
			pageMain.addEventListener('scroll', () => {
				showStickyNav = pageMain.scrollTop > 100;
			});

			window.addEventListener('resize', () => {
				showStickyNav = pageMain.scrollTop > 100;
				drawerStore.close();
			});
		}
	});
</script>

<Toast />

<Drawer>
	{#if $drawerStore.id == 'nav'}
		<NavItems {drawerStore} />
	{:else if $drawerStore.id == 'search'}
		<div class="p-3 pb-0 w-full h-full flex flex-col overflow-hidden">
			<div class="w-full" use:focusTrap={true}>
				<input
					class="input mb-3 rounded-lg w-full"
					placeholder={__('Who are you looking for?', $userLanguage)}
					bind:value={userSearchQuery}
					on:input={searchUsers}
				/>
			</div>
			<div class="overflow-y-auto">
				<div class="flex flex-col gap-2">
					{#each userSearchResults as user}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="flex items-center gap-2 p-1 rounded-lg cursor-pointer bg-surface-900 hover:bg-surface-700 transition-all"
							transition:scale={{ start: 0.99, duration: 200 }}
							on:click={() => {
								goto(`/u/${user.id}`);
								drawerStore.close();
								userSearchQuery = '';
								userSearchResults = [];
							}}
						>
							<img src="{avatarUrl}/{user.id}" alt={user.name} class="w-10 h-10 rounded-lg" />
							<p>{user.name}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</Drawer>

{#if $navigating}
	<div
		class="fixed top-0 right-0 w-screen h-screen z-50 pointer-events-none"
		in:fade={{ delay: 1500 }}
		out:fade={{ duration: 500 }}
	>
		<div class="h-full flex flex-col justify-center items-center gap-2 bg-surface-900/80">
			<BarLoader size="60" color="#fff" unit="px" duration="1s" />
			<p class="text-xs font-light">
				{__('This is taking longer than expected...', $userLanguage)}
			</p>
		</div>
	</div>
{/if}

{#if isRestricted($userData?.priv)}
	<div
		class="fixed left-4 top-1/2 transform -translate-y-1/2 z-40"
		in:fly={{ x: -50, duration: 300, delay: 500 }}
		out:fly={{ x: -50, duration: 300 }}
	>
		<div class="restriction-warning-card">
			<div class="restriction-warning-content">
				<div class="text-red-400 text-2xl mb-3 text-center">⚠️</div>
				<h4 class="font-bold text-white text-center mb-2 text-sm">
					{__('Account Restricted', $userLanguage)}
				</h4>
				<p class="text-xs text-gray-300 text-center mb-4 leading-relaxed px-2">
					{__(
						'Your account is currently restricted. Join our Discord and ping a moderator or admin for assistance.',
						$userLanguage
					)}
				</p>
				<button class="discord-btn" on:click={() => window.open(discordUrl, '_blank')}>
					{__('Join Discord', $userLanguage)}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isNervPath}
	<div class="honeycomb-nav">
		<div class="honeycomb-container">
			{#each nervNavItems as item, i}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="honeycomb-item"
					class:hovered={hoveredIndex === i}
					class:active={$page.url.pathname === item.path}
					on:click={() => goto(item.path)}
					on:mouseenter={() => (hoveredIndex = i)}
					on:mouseleave={() => (hoveredIndex = -1)}
					style="--delay: {i * 0.1}s"
				>
					{#if hoveredIndex === i}
						<div
							class="honeycomb-content"
							transition:fly={{
								x: getRandomOffset(),
								y: getRandomOffset(),
								duration: 400,
								easing: elasticOut
							}}
						>
							<div class="honeycomb-icon">{item.icon}</div>
							<div class="honeycomb-title">{item.title}</div>
						</div>
					{:else}
						<div class="honeycomb-content">
							<div class="honeycomb-icon">{item.icon}</div>
							<div class="honeycomb-title">{item.title}</div>
						</div>
					{/if}
					<svg class="honeycomb-border" viewBox="0 0 100 100" preserveAspectRatio="none">
						<path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" />
					</svg>
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-missing-attribute -->
<AppShell>
	<svelte:fragment slot="header">
		{#if ($page.data.url != '/signin' && $page.data.url != '/signup' && $page.data.url != '/nerv') || $page.status != 200}
			<div
				class="fixed w-full"
				in:fly={{ y: -15, duration: 200, delay: 200 }}
				out:fly={{ y: -15, duration: 200 }}
			>
				<div
					class="mx-auto border {showStickyNav
						? 'mt-2 w-[85%] bg-surface-700/95 rounded-lg border-surface-500'
						: 'w-[100%] bg-surface-700 border-surface-700'}  transition-all duration-700 z-[9999]"
				>
					<div class="flex p-2 px-4 flex-row justify-between items-center gap-2">
						<a
							class="text-xl cursor-pointer mr-12 flex items-center gap-2"
							on:click={() => goto('/')}
							><img src="/favicon.png" alt="tsuki" class="w-8 h-8" />{appName}</a
						>
						<div class="hidden md:flex flex-row justify-start items-center gap-2 me-auto">
							<NavItems {drawerStore} />
						</div>
						<div class="flex flex-row gap-5 items-center">
							<button
								class="btn px-2 py-2 rounded-lg variant-ghost-surface hidden md:block"
								on:click={() => goto('/donate')}
							>
								<Heart class="pointer-events-none" size={20} />
							</button>
							<div class="hidden md:block">
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
													<img
														width="30"
														src="/flags/{lang.code}.png"
														alt="flag-{lang.code}"
														class="mr-2"
													/>
													{lang.name}
												</button>
											{/each}
										</div>
									</svelte:fragment>
								</Popup>
							</div>
							<button
								class="btn px-5 variant-ghost-surface"
								on:click={() =>
									drawerStore.open({
										id: 'search',
										padding: 'pt-16 p-4',
										bgBackdrop: 'bg-black/50',
										position: 'top',
										width: 'mx-auto w-full md:w-[800px]',
										rounded: 'rounded-lg'
									})}
							>
								<Search class="pointer-events-none" size={18} />
							</button>
							<div class="hidden md:block">
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
														on:click={() => goto(`/u/${$userData?.id}`)}
														>{__('Profile', $userLanguage)}</button
													>
													<a class="w-32 btn variant-filled-surface rounded-lg" href="/settings"
														>{__('Settings', $userLanguage)}</a
													>
													{#if $userData?.clanId}
														<a
															class="w-32 btn variant-filled-surface rounded-lg"
															href="/clan/{$userData?.clanId}/settings"
															>{__('Clan', $userLanguage)}</a
														>
													{/if}
													<a class="w-32 btn variant-filled-surface rounded-lg" href="/friends"
														>{__('Friends', $userLanguage)}</a
													>
													<a class="w-32 btn variant-filled-surface rounded-lg" href="/logout"
														>{__('Logout', $userLanguage)}</a
													>
												{:else}
													<button
														class="w-32 btn variant-filled-surface rounded-lg"
														on:click={() => goto('/signin')}>{__('Sign In', $userLanguage)}</button
													>
													<button
														class="w-32 btn variant-filled-surface rounded-lg"
														on:click={() => goto('/signup')}>{__('Sign Up', $userLanguage)}</button
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
							<div class="md:hidden">
								<button
									class="btn btn-icon variant-ghost-surface rounded-lg"
									on:click={() =>
										drawerStore.open({
											id: 'nav',
											padding: 'p-4',
											rounded: 'rounded-lg'
										})}
								>
									<Menu class="pointer-events-none" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</svelte:fragment>
	{#key data.url}
		<div
			class={($page.data.url != '/signin' && $page.data.url != '/signup') || $page.status != 200
				? 'mt-14 h-[calc(100vh-3.5rem)]'
				: ''}
			in:scale={{ start: 0.99, duration: 200, delay: 200 }}
			out:scale={{ start: 0.99, duration: 200 }}
		>
			<slot />
		</div>
	{/key}

	<svelte:fragment slot="footer">
		{#if ($page.data.url != '/signin' && $page.data.url != '/signup') || $page.status != 200}
			<Footer />
		{/if}
	</svelte:fragment>
</AppShell>
