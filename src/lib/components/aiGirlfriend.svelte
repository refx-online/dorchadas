<script lang="ts">
	import { userData, userLanguage } from '$lib/storage';
	import { __ } from '$lib/language';
	import { slide, fade } from 'svelte/transition';
	import Heart from 'svelte-feathers/Heart.svelte';
	import XCircle from 'svelte-feathers/XCircle.svelte';
	import Send from 'svelte-feathers/Send.svelte';
	import MessageCircle from 'svelte-feathers/MessageCircle.svelte';

	let isOpen = false;
	let inputMessage = '';
	let isLoading = false;
	let chatContainer: HTMLDivElement;
	let messages: { role: 'user' | 'assistant'; content: string }[] = [
		{ role: 'assistant', content: 'Ugh, finally you’re here! 😤 Why did it take you so long? Do you even care about me? 💔' }
	];

	const toggleChat = () => {
		isOpen = !isOpen;
	};

	const sendMessage = async () => {
		if (!inputMessage.trim() || isLoading) return;

		const userMessage = inputMessage.trim();
		messages = [...messages, { role: 'user', content: userMessage }];
		inputMessage = '';
		isLoading = true;

		// scroll to bottom
		setTimeout(() => {
			if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
		}, 10);

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
			setTimeout(() => {
				if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 10);
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			sendMessage();
		}
	};
</script>

{#if $userData}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
		{#if isOpen}
			<div
				class="card w-80 h-96 flex flex-col shadow-xl variant-filled-surface border border-surface-500 overflow-hidden"
				transition:slide={{ axis: 'y' }}
			>
				<header class="p-3 bg-surface-700 border-b border-surface-500 flex justify-between items-center">
					<div class="flex items-center gap-2">
						<Heart class="text-error-500 animate-pulse" size={18} />
						<span class="font-bold">Annoying AI Girlfriend</span>
					</div>
					<button class="btn btn-sm hover:variant-soft-surface" on:click={toggleChat}>
						<XCircle size={18} />
					</button>
				</header>

				<div
					bind:this={chatContainer}
					class="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col"
				>
					{#each messages as message}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[85%] p-2 rounded-lg text-sm {message.role === 'user'
									? 'bg-primary-600 text-white rounded-br-none'
									: 'bg-surface-600 text-white rounded-bl-none'}"
							>
								{message.content}
							</div>
						</div>
					{/each}
					{#if isLoading}
						<div class="flex justify-start">
							<div class="bg-surface-600 text-white p-2 rounded-lg rounded-bl-none text-xs italic animate-pulse">
								typing something annoying...
							</div>
						</div>
					{/if}
				</div>

				<footer class="p-2 bg-surface-700 border-t border-surface-500 flex gap-2">
					<input
						class="input p-2 text-sm rounded-lg"
						placeholder="Talk to her..."
						bind:value={inputMessage}
						on:keydown={handleKeydown}
						disabled={isLoading}
					/>
					<button
						class="btn btn-sm variant-filled-primary rounded-lg"
						on:click={sendMessage}
						disabled={isLoading || !inputMessage.trim()}
					>
						<Send size={18} />
					</button>
				</footer>
			</div>
		{/if}

		<button
			class="btn btn-lg variant-filled-error rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
			on:click={toggleChat}
		>
			<MessageCircle size={24} />
			{#if !isOpen}
				<span class="text-xs font-bold uppercase tracking-wider">She's Waiting...</span>
			{/if}
		</button>
	</div>
{/if}
