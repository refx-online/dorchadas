<script lang="ts">
	import {
		appName,
		githubUrl,
		//twitterUrl,
		//youtubeUrl,
		discordUrl
	} from '$lib/env';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
</script>

<footer class="backdrop-blur-md bg-black/10 border-t border-white/5">
	<div class="p-3">
		<div class="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
			<div>
				<h3 class="font-semibold mb-1">{appName}</h3>
				<p class="text-gray-300 text-sm">
					{__('A community-driven osu! private server.', $userLanguage)}
					using
					<a
						href="https://github.com/osuAkatsuki/bancho.py"
						class="text-blue-500 hover:underline"
						target="_blank">bancho.py</a
					> instance
				</p>
			</div>

			<div>
				<h3 class="font-semibold mb-1">{__('Quick Links', $userLanguage)}</h3>
				<ul class="space-y-0.5">
					<li>
						<a href="/" class="hover:text-primary-400 transition-colors"
							>{__('Home', $userLanguage)}</a
						>
					</li>
					<li>
						<a href="/donate" class="hover:text-primary-400 transition-colors"
							>{__('Donate', $userLanguage)}</a
						>
					</li>
					<li>
						<a
							href={`${githubUrl}/bpy-web`}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-primary-400 transition-colors">Source Code</a
						>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="font-semibold mb-1">{__('Community', $userLanguage)}</h3>
				<ul class="space-y-0.5">
					<li>
						<a
							href={discordUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-primary-400 transition-colors">Discord</a
						>
					</li>
					<!--<li><a href={twitterUrl} target="_blank" rel="noopener noreferrer" class="hover:text-primary-400 transition-colors">Twitter</a></li>-->
					<!--<li><a href={youtubeUrl} target="_blank" rel="noopener noreferrer" class="hover:text-primary-400 transition-colors">Youtube</a></li>-->
					<li>
						<a
							href={githubUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-primary-400 transition-colors">GitHub</a
						>
					</li>
				</ul>
			</div>

			<div>
				<h3 class="font-semibold mb-1">{__('Info', $userLanguage)}</h3>
				<ul class="space-y-0.5">
					<li>
						<a href="/rules" class="hover:text-primary-400 transition-colors"
							>{__('Rules', $userLanguage)}</a
						>
					</li>
					<li>
						<a href="/bbcode" class="hover:text-primary-400 transition-colors"
							>{__('BBCode', $userLanguage)}</a
						>
					</li>
					<li>
						<a href="/welcome" class="hover:text-primary-400 transition-colors"
							>{__('How to connect', $userLanguage)}</a
						>
					</li>
				</ul>
			</div>
		</div>

		<div
			class="border-t border-surface-700/50 pt-2 flex flex-col md:flex-row justify-between items-center text-2xs text-gray-300"
		>
			<p>
				© {new Date().getFullYear()}
				{appName}. {__('All rights reserved.', $userLanguage)}
			</p>
			<p>{__('Not affiliated with ppy or osu!.', $userLanguage)}</p>
		</div>
	</div>
</footer>

<style>
	footer {
		color: white;
	}

	.text-2xs {
		font-size: 0.65rem;
		line-height: 1rem;
	}
</style>
