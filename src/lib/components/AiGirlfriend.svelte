<script lang="ts">
	import { userData, userLanguage } from '$lib/storage';
	import { __ } from '$lib/language';
	import { slide, fade, scale } from 'svelte/transition';
	import Heart from 'svelte-feathers/Heart.svelte';
	import Send from 'svelte-feathers/Send.svelte';
	import Image from 'svelte-feathers/Image.svelte';
	import Globe from 'svelte-feathers/Globe.svelte';
	import X from 'svelte-feathers/X.svelte';
	import { onMount } from 'svelte';

	let inputMessage = '';
	let isLoading = false;
	let chatContainer: HTMLDivElement;
	let isSearchMode = false;
	let selectedImage: string | null = null;
	let fileInput: HTMLInputElement;

	let messages: { role: 'user' | 'assistant'; content: string; image?: string }[] = [
		{
			role: 'assistant',
			content:
				'Ugh, finally you’re here! 😤 Why did it take you so long? Do you even care about me? 💔'
		}
	];

	const scrollToBottom = () => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	};

	onMount(() => {
		scrollToBottom();
	});

	const handleImageSelect = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			// Limit file size to 1MB for base64 safety
			if (file.size > 1024 * 1024) {
				alert('That file is too big! Are you trying to crash our love? 😤 (Max 1MB)');
				return;
			}
			const reader = new FileReader();
			reader.onload = (e) => {
				selectedImage = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	};

	const clearImage = () => {
		selectedImage = null;
		if (fileInput) fileInput.value = '';
	};

	const sendMessage = async () => {
		if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

		const userMessage = inputMessage.trim();
		const currentImage = selectedImage;

		messages = [
			...messages,
			{
				role: 'user',
				content: userMessage || (currentImage ? '(Sent an image)' : ''),
				image: currentImage || undefined
			}
		];

		inputMessage = '';
		clearImage();
		isLoading = true;

		setTimeout(scrollToBottom, 10);

		try {
			const response = await fetch('/api/v1/ai-girlfriend', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: messages.map((m) => ({ role: m.role, content: m.content })),
					search: isSearchMode,
					image: currentImage
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get response');
			}

			const data = await response.json();
			messages = [...messages, { role: 'assistant', content: data.reply }];
		} catch (error) {
			messages = [
				...messages,
				{
					role: 'assistant',
					content:
						'Stop annoying me with your technical problems! 🙄 (Something went wrong, try again later.)'
				}
			];
		} finally {
			isLoading = false;
			setTimeout(scrollToBottom, 10);
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			sendMessage();
		}
	};
</script>

<div
	class="w-full max-w-4xl mx-auto h-[75vh] flex flex-col shadow-2xl variant-filled-surface border border-surface-500 rounded-xl overflow-hidden"
>
	<header class="p-4 bg-surface-700 border-b border-surface-500 flex justify-between items-center">
		<div class="flex items-center gap-3">
			<Heart class="text-error-500 animate-pulse" size={24} />
			<span class="font-bold text-xl">Annoying AI Girlfriend</span>
		</div>
		<div class="flex items-center gap-4">
			<button
				class="btn btn-sm flex items-center gap-2 {isSearchMode
					? 'variant-filled-secondary'
					: 'variant-soft-surface'}"
				on:click={() => (isSearchMode = !isSearchMode)}
				title="Toggle Web Search Mode"
			>
				<Globe size={16} />
				<span class="hidden sm:inline">Web Search</span>
			</button>
			<div class="text-xs italic text-surface-400 hidden sm:block">Online and annoyed</div>
		</div>
	</header>

	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col bg-surface-900/50"
	>
		{#each messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-[80%] p-3 rounded-2xl text-base flex flex-col gap-2 {message.role === 'user'
						? 'bg-primary-600 text-white rounded-br-none'
						: 'bg-surface-600 text-white rounded-bl-none'}"
					transition:fade
				>
					{#if message.image}
						<img src={message.image} alt="Sent" class="max-w-full rounded-lg shadow-md mb-1" />
					{/if}
					<span>{message.content}</span>
				</div>
			</div>
		{/each}
		{#if isLoading}
			<div class="flex justify-start">
				<div
					class="bg-surface-600 text-white p-3 rounded-2xl rounded-bl-none text-sm italic animate-pulse"
				>
					{isSearchMode
						? 'searching the web to find something to argue about...'
						: 'typing something annoying...'}
				</div>
			</div>
		{/if}
	</div>

	{#if selectedImage}
		<div
			class="px-4 py-2 bg-surface-800 border-t border-surface-500 flex items-center gap-4"
			transition:slide
		>
			<div class="relative group">
				<img
					src={selectedImage}
					alt="Preview"
					class="w-16 h-16 object-cover rounded-lg border border-surface-400"
				/>
				<button
					class="absolute -top-2 -right-2 btn btn-icon btn-sm variant-filled-error scale-75"
					on:click={clearImage}
				>
					<X size={14} />
				</button>
			</div>
			<div class="text-xs text-surface-300">
				Ready to show her this? She'll probably find a reason to be mad.
			</div>
		</div>
	{/if}

	<footer class="p-4 bg-surface-700 border-t border-surface-500 flex gap-3 items-center">
		<input
			type="file"
			accept="image/*"
			class="hidden"
			bind:this={fileInput}
			on:change={handleImageSelect}
		/>
		<button
			class="btn btn-icon variant-soft-surface"
			on:click={() => fileInput.click()}
			title="Upload Image"
		>
			<Image size={20} />
		</button>

		<input
			class="input p-3 text-base rounded-xl"
			placeholder={isSearchMode ? 'Ask her to search something...' : 'Talk to her...'}
			bind:value={inputMessage}
			on:keydown={handleKeydown}
			disabled={isLoading}
		/>
		<button
			class="btn btn-lg variant-filled-primary rounded-xl"
			on:click={sendMessage}
			disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
		>
			<Send size={20} />
		</button>
	</footer>
</div>

<style>
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
