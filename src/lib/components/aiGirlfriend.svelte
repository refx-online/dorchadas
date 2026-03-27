<script lang="ts">
	import { userData, userLanguage } from '$lib/storage';
	import { __ } from '$lib/language';
	import { slide, fade } from 'svelte/transition';
	import Heart from 'svelte-feathers/Heart.svelte';
	import Send from 'svelte-feathers/Send.svelte';
	import { onMount } from 'svelte';

	let inputMessage = '';
	let isLoading = false;
	let chatContainer: HTMLDivElement;
	let messages: { role: 'user' | 'assistant'; content: string }[] = [
		{ role: 'assistant', content: 'Ugh, finally you’re here! 😤 Why did it take you so long? Do you even care about me? 💔' }
	];

	const scrollToBottom = () => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	};

	onMount(() => {
		scrollToBottom();
	});

	const sendMessage = async () => {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = inputMessage.trim();
		messages = [...messages, { role: 'user', content: userMessage }];
		inputMessage = '';
		isLoading = true;

		// scroll to bottom
		setTimeout(scrollToBottom, 10);

		try {
			const response = await fetch('/api/v1/ai-girlfriend', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: messages.map(m => ({ role: m.role, content: m.content }))
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get response');
			}

			const data = await response.json();
			messages = [...messages, { role: 'assistant', content: data.reply }];
		} catch (error) {
			console.error('Chat error:', error);
			messages = [...messages, { role: 'assistant', content: 'Stop annoying me with your technical problems! 🙄 (Something went wrong, try again later.)' }];
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

<div class="w-full max-w-4xl mx-auto h-[70vh] flex flex-col shadow-2xl variant-filled-surface border border-surface-500 rounded-xl overflow-hidden">
	<header class="p-4 bg-surface-700 border-b border-surface-500 flex justify-between items-center">
		<div class="flex items-center gap-3">
			<Heart class="text-error-500 animate-pulse" size={24} />
			<span class="font-bold text-xl">Annoying AI Girlfriend</span>
		</div>
		<div class="text-xs italic text-surface-400">Online and annoyed</div>
	</header>

	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col bg-surface-900/50"
	>
		{#each messages as message}
			<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-[80%] p-3 rounded-2xl text-base {message.role === 'user'
						? 'bg-primary-600 text-white rounded-br-none'
						: 'bg-surface-600 text-white rounded-bl-none'}"
					transition:fade
				>
					{message.content}
				</div>
			</div>
		{/each}
		{#if isLoading}
			<div class="flex justify-start">
				<div class="bg-surface-600 text-white p-3 rounded-2xl rounded-bl-none text-sm italic animate-pulse">
					typing something annoying...
				</div>
			</div>
		{/if}
	</div>

	<footer class="p-4 bg-surface-700 border-t border-surface-500 flex gap-3">
		<input
			class="input p-3 text-base rounded-xl"
			placeholder="Talk to her..."
			bind:value={inputMessage}
			on:keydown={handleKeydown}
			disabled={isLoading}
		/>
		<button
			class="btn btn-lg variant-filled-primary rounded-xl"
			on:click={sendMessage}
			disabled={isLoading || !inputMessage.trim()}
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
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: .5;
		}
	}
</style>
