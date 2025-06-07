<script lang="ts">
	import { goto } from '$app/navigation';
	import { appName } from '$lib/env';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import ChevronLeft from 'svelte-feathers/ChevronLeft.svelte';
	import Server from 'svelte-feathers/Server.svelte';
	import Download from 'svelte-feathers/Download.svelte';
	import { fly, scale } from 'svelte/transition';
</script>

<svelte:head>
	<title>{appName} :: Getting Started</title>
</svelte:head>

<div class="w-screen h-screen flex flex-col justify-center items-center">
	<div class="md:min-w-[600px] max-w-[700px] min-h-[500px] p-2 md:border md:border-surface-700 rounded-lg gap-3">
		<a
			class="block bg-white/5 hover:bg-white/10 transition-colors cursor-pointer rounded-full p-2 w-fit"
			href="/"
		>
			<ChevronLeft class="pointer-events-none" />
		</a>
		
		<div class="p-10 h-full">
			<div
				class="w-full h-full flex flex-col justify-center items-center text-center"
				in:fly={{ y: 20, duration: 300 }}
				use:focusTrap={true}
			>
				<div in:scale={{ start: 0.9, delay: 200, duration: 400 }} class="mb-6">
					<Server size={60} class="text-pink-500" />
				</div>
				
				<h1 class="text-3xl font-bold mb-4">
					{__('Welcome to {{val}}!', $userLanguage, { val: appName })}
				</h1>
				
				<p class="text-surface-300 mb-8 max-w-md">
					{__('Follow these steps to connect to our server and start playing!', $userLanguage)}
				</p>
				
				<div class="bg-surface-800 border border-surface-600 rounded-lg p-6 mb-8 max-w-lg w-full">
					<h3 class="text-lg font-semibold mb-4 text-pink-400 flex items-center justify-center">
						<Download size={20} class="mr-2" />
						{__('How to Connect', $userLanguage)}
					</h3>
					
					<div class="text-left space-y-4">
						<div class="flex items-start">
							<span class="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-4 mt-1 flex-shrink-0">1</span>
							<div>
								<p class="text-surface-200 font-medium mb-1">
									{__('Find your osu! executable', $userLanguage)}
								</p>
								<p class="text-surface-400 text-sm">
									{__('Usually located in:', $userLanguage)}
								</p>
								<div class="bg-surface-900 border border-surface-600 rounded p-2 text-xs font-mono mt-1">
									C:\Users\YourName\AppData\Local\osu!\osu!.exe
								</div>
							</div>
						</div>
						
						<div class="flex items-start">
							<span class="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-4 mt-1 flex-shrink-0">2</span>
							<div>
								<p class="text-surface-200 font-medium mb-1">
									{__('Create a shortcut', $userLanguage)}
								</p>
								<p class="text-surface-400 text-sm mb-2">
									{__('Right-click on osu!.exe → "Create shortcut"', $userLanguage)}
								</p>
							</div>
						</div>
						
						<div class="flex items-start">
							<span class="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-4 mt-1 flex-shrink-0">3</span>
							<div>
								<p class="text-surface-200 font-medium mb-1">
									{__('Edit shortcut properties', $userLanguage)}
								</p>
								<p class="text-surface-400 text-sm mb-2">
									{__('Right-click the shortcut → Properties → In the "Target" field, add:', $userLanguage)}
								</p>
								<div class="bg-surface-900 border border-surface-600 rounded p-3 text-sm font-mono">
									<div class="flex items-center justify-between">
										<span class="text-pink-300">-devserver refx.online</span>
										<button 
											class="text-xs bg-pink-600 hover:bg-pink-700 px-2 py-1 rounded"
											on:click={() => navigator.clipboard.writeText('-devserver refx.online')}
										>
											Copy
										</button>
									</div>
								</div>
								<p class="text-surface-400 text-xs mt-1">
									{__('Add this at the end of the existing target path', $userLanguage)}
								</p>
							</div>
						</div>
						
						<div class="flex items-start">
							<span class="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-4 mt-1 flex-shrink-0">4</span>
							<div>
								<p class="text-surface-200 font-medium mb-1">
									{__('Launch and login', $userLanguage)}
								</p>
								<p class="text-surface-400 text-sm">
									{__('Double-click your shortcut and login with your new account!', $userLanguage)}
								</p>
							</div>
						</div>
					</div>
				</div>
				
				<div class="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6 max-w-lg w-full">
					<p class="text-yellow-300 text-sm">
						<strong>{__('Pro Tip:', $userLanguage)}</strong> 
						{__('Rename your shortcut to "osu! (refx.online)" so you know which one connects to our server!', $userLanguage)}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>