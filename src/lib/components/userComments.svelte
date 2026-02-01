<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { userData, userLanguage } from '$lib/storage';
	import { Trash2, Edit2, Check, X } from 'svelte-feathers';
	import { avatarUrl } from '$lib/env';
	import { __ } from '$lib/language';
	import { invalidateAll } from '$app/navigation';

	interface Comment {
		id: number;
		user_id: number;
		from_id: number;
		comment: string;
		created_at: string;
		updated_at: string | null;
		from_name: string;
		from_avatar: string;
	}

	export let userId: number;
	export let csrfToken: String;

	let comments: Comment[] = [];
	let newComment: string = '';
	let editingCommentId: number | null = null;
	let editingContent: string = '';
	let loading = true;
	let error: string | null = null;

	async function loadComments() {
		try {
			const response = await fetch(`/api/v1/comments/${userId}`);
			if (!response.ok) throw new Error('Failed to load comments');
			comments = await response.json();
			loading = false;
		} catch {
			error = 'Failed to load comments';
			loading = false;
		}
	}

	function startEditing(comment: Comment) {
		editingCommentId = comment.id;
		editingContent = comment.comment;
	}

	function cancelEditing() {
		editingCommentId = null;
		editingContent = '';
	}

	async function saveEdit(commentId: number, csrfToken: String) {
		if (!editingContent.trim()) {
			return;
		}

		const formData = new FormData();
		formData.append('commentId', commentId.toString());
		formData.append('comment', editingContent);
		formData.append('csrf_token', csrfToken.toString());

		try {
			const response = await fetch('?/editComment', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				throw new Error('Failed to edit comment');
			}

			await loadComments();
			editingCommentId = null;
			editingContent = '';
		} catch {
			error = 'Failed to edit comment';
		} finally {
			await invalidateAll();
		}
	}

	// 2/13/24 11:55 PM
	function formatTime(timestamp: string) {
		const date = new Date(timestamp);
		const hours = date.getHours() % 12 || 12;
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
		return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)} ${hours}:${minutes} ${ampm}`;
	}

	onMount(() => {
		loadComments();
	});
</script>

<div class="card !bg-surface-700 w-full py-3 p-6">
	<div class="flex flex-col gap-5">
		{#if $userData}
			<form
				method="POST"
				action="?/addComment"
				use:enhance={() => {
					return async ({ update }) => {
						await update({ reset: true });
						newComment = '';
						await loadComments();
					};
				}}
				class="flex flex-col gap-2"
			>
				<input type="hidden" name="csrf_token" value={csrfToken} />
				<input type="hidden" name="userId" value={userId} />
				<textarea
					name="comment"
					bind:value={newComment}
					class="textarea w-full bg-surface-600"
					placeholder="Write a comment..."
					required
					minlength="1"
					maxlength="500"
				></textarea>
				<button
					type="submit"
					class="btn variant-filled-primary w-fit ml-auto"
					disabled={!newComment.trim()}
				>
					{__('Post Comment', $userLanguage)}
				</button>
			</form>
		{:else}
			<p class="text-surface-400 italic text-center">
				{__('Please sign in to leave a comment', $userLanguage)}
			</p>
		{/if}

		{#if loading}
			<p class="text-center text-surface-400">{__('Loading comments...', $userLanguage)}</p>
		{:else if error}
			<p class="text-center text-error-400">{error}</p>
		{:else if comments.length === 0}
			<p class="text-center text-surface-400 italic">{__('No comments yet', $userLanguage)}</p>
		{:else}
			<div class="flex flex-col gap-4">
				{#each comments as comment (comment.id)}
					<div class="flex gap-4 p-4 bg-surface-600 rounded-lg">
						<a href="/u/{comment.from_id}" class="shrink-0">
							<img
								src="{avatarUrl}/{comment.from_id}"
								alt="Avatar"
								class="w-12 h-12 rounded-full"
							/>
						</a>
						<div class="flex-1">
							<div class="flex justify-between items-start">
								<div>
									<a href="/u/{comment.from_id}" class="font-semibold hover:text-primary-400">
										{comment.from_name}
									</a>
									<span class="text-xs text-surface-400 ml-2">
										{formatTime(comment.created_at)}
										{#if comment.updated_at}
											<span class="ml-1">({__('edited', $userLanguage)})</span>
										{/if}
									</span>
								</div>

								{#if $userData?.id === comment.from_id}
									<div class="flex gap-2">
										{#if editingCommentId === comment.id}
											<button
												class="btn btn-icon variant-filled-success h-8 w-8"
												on:click={() => saveEdit(comment.id, csrfToken)}
											>
												<Check size={16} />
											</button>
											<button
												class="btn btn-icon variant-filled-surface h-8 w-8"
												on:click={cancelEditing}
											>
												<X size={16} />
											</button>
										{:else}
											<button
												class="btn btn-icon variant-filled-surface h-8 w-8"
												on:click={() => startEditing(comment)}
											>
												<Edit2 size={16} />
											</button>
											<form
												method="POST"
												action="?/deleteComment"
												use:enhance={() => {
													return async ({ update }) => {
														await update();
														await loadComments();
													};
												}}
											>
												<input type="hidden" name="csrf_token" value={csrfToken} />
												<input type="hidden" name="commentId" value={comment.id} />
												<button type="submit" class="btn btn-icon variant-filled-error h-8 w-8">
													<Trash2 size={16} />
												</button>
											</form>
										{/if}
									</div>
								{/if}
							</div>

							{#if editingCommentId === comment.id}
								<textarea
									bind:value={editingContent}
									class="textarea w-full bg-surface-500 mt-2"
									rows="3"
								></textarea>
							{:else}
								<p class="mt-2 break-words">{comment.comment}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
