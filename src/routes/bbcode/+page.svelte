<script lang="ts">
	import { parseBBCodeToHtml } from '$lib/bbcode';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import { appName } from '$lib/env';

	// can someone please rework this
	const bbcodes = [
		{
			name: 'Text Formatting',
			code: '[b][/b], [i][/i], [u][/u], [s][/s]',
			description: 'Basic text formatting options for bold, italic, underline, and strikethrough.',
			example: '[b]Bold[/b], [i]Italic[/i], [u]Underline[/u], [s]Strikethrough[/s]'
		},
		{
			name: 'Links',
			code: '[url=link]text[/url] or [url]link[/url]',
			description: 'Create clickable links. Opens in a new tab.',
			example: '[url=https://example.com]Visit Example[/url]'
		},
		{
			name: 'Images',
			code: '[img]url[/img]',
			description: 'Display images from a URL.',
			example: '[img]https://example.com/image.jpg[/img]'
		},
		{
			name: 'Color',
			code: '[color=value]text[/color]',
			description: 'Color text using color names or hex values.',
			example: '[color=red]Red Text[/color]'
		},
		{
			name: 'Size',
			code: '[size=value]text[/size]',
			description: 'Change text size (1-80 pixels).',
			example: '[size=20]Larger Text[/size]'
		},
		{
			name: 'Lists',
			code: '[list][*]item[/list] or [list=1][*]item[/list]',
			description: 'Create bullet or numbered lists. (WIP)',
			example: '[list]\n[*]Item 1\n[*]Item 2\n[/list]'
		},
		{
			name: 'Code',
			code: '[code]content[/code]',
			description: 'Format text as code with monospace font.',
			example: '[code]function example() { return true; }[/code]'
		},
		{
			name: 'Heading',
			code: '[heading]text[/heading]',
			description: 'Create a section heading. (WIP)',
			example: '[heading]Section Title[/heading]'
		},
		{
			name: 'Notice',
			code: '[notice]text[/notice]',
			description: 'Display important information in a highlighted box. (WIP)',
			example: '[notice]Important announcement![/notice]'
		},
		{
			name: 'Spoiler',
			code: '[spoiler]text[/spoiler]',
			description: 'Hide content that can be revealed by clicking. (WIP)',
			example: '[spoiler]Hidden content[/spoiler]'
		},
		{
			name: 'Box',
			code: '[box=color]content[/box]',
			description: 'Create a colored box containing content. (WIP)',
			example: '[box=#f0f0f0]Content in a gray box[/box]'
		},
		{
			name: 'Spotify',
			code: '[spotify]url[/spotify] or [spotify=width,height]url[/spotify]',
			description: 'Embed a Spotify player with optional custom dimensions.',
			example:
				'[spotify]https://open.spotify.com/track/6LY9viOYIMvzdOIxBQDWdI?si=dc840cad910f433d[/spotify]'
		},
		{
			name: 'Audio',
			code: '[audio]url[/audio]',
			description: 'Embed an audio player.',
			example: '[audio]https://example.com/audio.mp3[/audio]'
		},
		{
			name: 'Center',
			code: '[centre]content[/centre]',
			description: 'Center-align content.',
			example: '[centre]Centered content[/centre]'
		}
	];
</script>

<svelte:head>
	<title>{appName} :: BBCode</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-8">
	<header class="space-y-4">
		<h1 class="h1">{__('BBCode', $userLanguage)}</h1>
		<p class="text-surface-400">
			{__(
				'BBCode is a markup language used for formatting posts and messages. Below is a comprehensive guide to all available BBCode tags and their usage. ',
				$userLanguage
			)}
			{__('Its not done yet but its functional!', $userLanguage)}
		</p>
	</header>

	<div class="grid grid-cols-1 gap-6">
		{#each bbcodes as bbcode}
			<div class="card p-4 variant-filled-surface">
				<header class="card-header">
					<h2 class="h2">{__(bbcode.name, $userLanguage)}</h2>
				</header>

				<section class="p-4 space-y-4">
					<div class="card variant-ghost-surface p-4">
						<h3 class="h3 mb-2">{__('Syntax', $userLanguage)}</h3>
						<pre class="text-sm font-mono bg-surface-900 p-2 rounded">{bbcode.code}</pre>
					</div>

					<div>
						<h3 class="h3 mb-2">{__('Description', $userLanguage)}</h3>
						<p class="text-surface-300">{__(bbcode.description, $userLanguage)}</p>
					</div>

					<div class="card variant-ghost-surface p-4">
						<h3 class="h3 mb-2">{__('Example', $userLanguage)}</h3>
						<div class="space-y-2">
							<pre class="text-sm font-mono bg-surface-900 p-2 rounded">{bbcode.example}</pre>
							<div class="card variant-filled p-4">
								{@html parseBBCodeToHtml(bbcode.example)}
							</div>
						</div>
					</div>
				</section>
			</div>
		{/each}
	</div>
</div>
