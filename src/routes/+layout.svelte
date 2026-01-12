<script lang="ts">
	import '../app.postcss';
	import {
		AppShell,
		Avatar,
		type PopupSettings,
		popup,
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
	import { csrfToken } from '$lib/storage';

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	initializeStores();

	const drawerStore = getDrawerStore();

	export let data;

	$: csrfToken.set(data.csrfToken);

	if ('currentUser' in data) {
		userData.set(data.currentUser as UserData);
	}

	let showStickyNav = false;

	let userSearchResults: { id: number; name: string }[] = [];
	let userSearchQuery = '';
	let userSearchTimeout: any;

	let restrictedWarnOpen = true;

	function toggleRestrict() {
		restrictedWarnOpen = !restrictedWarnOpen;
	}

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
    ];
    
    function getRandomOffset() {
        return (Math.random() - 0.5) * 20;
    }

    $: isNervPath = $page.url.pathname.startsWith('/nerv');

	onMount(() => {
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
					{__('Your account is currently restricted. Join our Discord and ping a moderator or admin for assistance.', $userLanguage)}
				</p>
				<button
					class="discord-btn"
					on:click={() => window.open(discordUrl, '_blank')}
				>
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
                    on:mouseenter={() => hoveredIndex = i}
                    on:mouseleave={() => hoveredIndex = -1}
                    style="--delay: {i * 0.1}s"
                >
                    {#if hoveredIndex === i}
                        <div 
                            class="honeycomb-content"
                            transition:fly="{{ 
                                x: getRandomOffset(), 
                                y: getRandomOffset(),
                                duration: 400,
                                easing: elasticOut
                            }}"
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
						<a class="text-xl cursor-pointer mr-12 flex items-center gap-2" on:click={() => goto('/')}
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

<style>
    .honeycomb-nav {
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        z-index: 1000;
    }

    .honeycomb-container {
        display: grid;
        grid-template-columns: repeat(3, 60px);
        grid-template-rows: repeat(3, 70px);
        gap: 5px;
        transform: rotate(-30deg);
    }

    .honeycomb-item {
        position: relative;
        width: 60px;
        height: 70px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        opacity: 0;
        animation: fadeIn 0.5s forwards;
        animation-delay: var(--delay);
    }

    .honeycomb-item:nth-child(3n + 2) {
        transform: translateY(35px);
    }

    .honeycomb-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(30deg);
        width: 100%;
        text-align: center;
        z-index: 1;
    }

    .honeycomb-icon {
        font-size: 1.2em;
        margin-bottom: 0.2rem;
    }

    .honeycomb-title {
        font-size: 0.7em;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .honeycomb-item:hover .honeycomb-title {
        opacity: 1;
    }

    .honeycomb-border {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    .honeycomb-border path {
        fill: rgba(255, 62, 0, 0.1);
        stroke: #ff3e00;
        stroke-width: 2;
        transition: all 0.3s ease;
    }

    .honeycomb-item:hover .honeycomb-border path {
        fill: rgba(255, 62, 0, 0.2);
        stroke-width: 3;
        filter: drop-shadow(0 0 5px #ff3e00);
    }

    .honeycomb-item.active .honeycomb-border path {
        fill: rgba(255, 62, 0, 0.3);
        stroke-width: 3;
        filter: drop-shadow(0 0 8px #ff3e00);
    }

    .honeycomb-item.active .honeycomb-title {
        opacity: 1;
    }

    .honeycomb-item.hovered {
        z-index: 2;
        transform: scale(1.1);
    }

    .honeycomb-item.hovered:nth-child(3n + 2) {
        transform: translateY(35px) scale(1.1);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0.5);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @media (max-width: 768px) {
        .honeycomb-nav {
            bottom: 1rem;
            left: 1rem;
        }

        .honeycomb-container {
            grid-template-columns: repeat(3, 50px);
            grid-template-rows: repeat(3, 58px);
        }

        .honeycomb-item {
            width: 50px;
            height: 58px;
        }

        .honeycomb-item:nth-child(3n + 2) {
            transform: translateY(29px);
        }

        .honeycomb-item.hovered:nth-child(3n + 2) {
            transform: translateY(29px) scale(1.1);
        }
    }
	.restriction-warning-card { 
        width: 180px;
        background: rgba(20, 20, 20, 0.9);
        border: 1px solid rgba(100, 100, 100, 0.3);
        border-radius: 12px;
        padding: 16px;
        backdrop-filter: blur(10px);
        box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        position: relative;
        overflow: hidden;
    }

    .restriction-warning-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.05) 100%);
        pointer-events: none;
    }

    .restriction-warning-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .discord-btn {
        background: linear-gradient(135deg, #5865f2, #4752c4);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(88, 101, 242, 0.3);
        width: 100%;
    }

    .discord-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
        background: linear-gradient(135deg, #6b73ff, #5865f2);
    }

    .discord-btn:active {
        transform: translateY(0px);
        box-shadow: 0 2px 6px rgba(88, 101, 242, 0.3);
    }

    @media (max-width: 768px) {
        .restriction-warning-card {
            width: 160px;
            padding: 12px;
        }
        
        .discord-btn {
            padding: 6px 12px;
            font-size: 10px;
        }
    }
</style>