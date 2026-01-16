<script lang="ts">
	import { goto } from '$app/navigation';
	import { appName, appUrl } from '$lib/env';
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

<div class="min-h-screen w-full flex flex-col justify-center items-center p-4">
	<div class="w-full max-w-[700px] min-h-[500px] md:border md:border-surface-700 rounded-lg">
		<div class="p-2 md:p-4">
			<a
				class="block bg-white/5 hover:bg-white/10 transition-colors cursor-pointer rounded-full p-2 w-fit"
				href="/"
			>
				<ChevronLeft class="pointer-events-none" />
			</a>
		</div>

		<div class="px-4 pb-4 md:p-10 h-full">
			<div
				class="w-full h-full flex flex-col justify-center items-center text-center"
				in:fly={{ y: 20, duration: 300 }}
				use:focusTrap={true}
			>
				<div in:scale={{ start: 0.9, delay: 200, duration: 400 }} class="mb-6">
					<Server size={60} class="text-surface-400" />
				</div>

				<h1 class="text-2xl md:text-3xl font-bold mb-4">
					{__('Welcome to {{val}}!', $userLanguage, { val: appName })}
				</h1>

				<p class="text-surface-300 mb-8 max-w-md text-sm md:text-base">
					{__('Follow these steps to connect to our server and start playing!', $userLanguage)}
				</p>

				<div class="bg-surface-800 border border-surface-600 rounded-lg p-4 md:p-6 mb-8 w-full">
					<h3
						class="text-base md:text-lg font-semibold mb-4 text-surface-300 flex items-center justify-center"
					>
						<Download size={20} class="mr-2" />
						{__('How to Connect', $userLanguage)}
					</h3>

					<div class="text-left space-y-4">
						<div class="flex items-start">
							<span
								class="bg-surface-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 md:mr-4 mt-1 flex-shrink-0"
								>1</span
							>
							<div class="flex-1 min-w-0">
								<p class="text-surface-200 font-medium mb-1 text-sm md:text-base">
									{__('Find your osu! executable', $userLanguage)}
								</p>
								<p class="text-surface-400 text-xs md:text-sm">
									{__('Usually located in:', $userLanguage)}
								</p>
								<div
									class="bg-surface-900 border border-surface-600 rounded p-2 text-xs font-mono mt-1 overflow-x-auto"
								>
									<code class="whitespace-nowrap"
										>C:\Users\YourName\AppData\Local\osu!\osu!.exe</code
									>
								</div>
							</div>
						</div>

						<div class="flex items-start">
							<span
								class="bg-surface-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 md:mr-4 mt-1 flex-shrink-0"
								>2</span
							>
							<div class="flex-1 min-w-0">
								<p class="text-surface-200 font-medium mb-1 text-sm md:text-base">
									{__('Create a shortcut', $userLanguage)}
								</p>
								<p class="text-surface-400 text-xs md:text-sm mb-2">
									{__('Right-click on osu!.exe → "Create shortcut"', $userLanguage)}
								</p>
							</div>
						</div>

						<div class="flex items-start">
							<span
								class="bg-surface-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 md:mr-4 mt-1 flex-shrink-0"
								>3</span
							>
							<div class="flex-1 min-w-0">
								<p class="text-surface-200 font-medium mb-1 text-sm md:text-base">
									{__('Edit shortcut properties', $userLanguage)}
								</p>
								<p class="text-surface-400 text-xs md:text-sm mb-2">
									{__(
										'Right-click the shortcut → Properties → In the "Target" field, add:',
										$userLanguage
									)}
								</p>
								<div class="bg-surface-900 border border-surface-600 rounded p-3 text-sm font-mono">
									<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
										<span class="text-surface-300 break-all">-devserver remeliah.cyou</span>
										<button
											class="text-xs bg-surface-600 hover:bg-surface-700 px-2 py-1 rounded self-start sm:self-auto flex-shrink-0"
											on:click={() => navigator.clipboard.writeText(`-devserver remeliah.cyou`)}
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
							<span
								class="bg-surface-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 md:mr-4 mt-1 flex-shrink-0"
								>4</span
							>
							<div class="flex-1 min-w-0">
								<p class="text-surface-200 font-medium mb-1 text-sm md:text-base">
									{__('Launch and login', $userLanguage)}
								</p>
								<p class="text-surface-400 text-xs md:text-sm">
									{__('Double-click your shortcut and login with your new account!', $userLanguage)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
