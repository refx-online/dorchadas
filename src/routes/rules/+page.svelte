<script lang="ts">
	import './style.postcss';
	import { fade, slide } from 'svelte/transition';
	import { __ } from '$lib/language';
	import { userLanguage } from '$lib/storage';
	import { appName } from '$lib/env';

	function t(key: string) {
		return __(`${key}`, $userLanguage);
	}
</script>

<svelte:head>
	<title>{appName} :: Rules</title>
</svelte:head>

<div class="content container mx-auto px-4 py-8 relative z-[2]">
	<section
		class="section relative z-[3]"
		in:slide={{ duration: 300, axis: 'x' }}
		out:fade={{ duration: 200 }}
	>
		<div class="header-container">
			<div class="header-logo">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="white"
					width="32"
					height="32"
				>
					<!-- dear god -->
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width={2}
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
			</div>
			<h1 class="text-4xl">{t('Rules')}</h1>
		</div>
		<p class="subtitle">{t("There's rules?")}</p>
		<ol class="list-decimal">
			<li>
				<strong>{t('Use common sense')}</strong>
				<p>
					{t(
						'This includes being respectful to each other when interacting, as well as not doing (or abusing) things that are unintended.'
					)}
					{t('If you happen to find bugs, please inform one of our developers on our discord.')}
				</p>
			</li>
			<li>
				<strong>{t("Don't create multiple accounts")}</strong>
				<p>
					{t(
						'As you are probably used from the official osu! servers, creating more than one account per person is a bannable offense.'
					)}
				</p>
			</li>
			<li>
				<strong>{t("Don't cheat")}</strong>
				<p>
					{t(
						'Using any form of cheating software, hacks, or external assistance on vanilla | relax | autopilot | touchdevice mode is strictly prohibited and will result in a permanent ban.'
					)}
				</p>
			</li>
		</ol>
		<h2 class="text-2xl mt-6 mb-4">{t('Additional Information')}</h2>
		<h3 class="text-xl mb-2">
			<strong>{t('Where do I report a user that breaks the rules?')}</strong>
		</h3>
		<p>
			{t(
				'To report a user, please report to a moderator on our Discord. Everything further will be handled with them'
			)}
		</p>
		<h3 class="text-xl mt-4 mb-2"><strong>{t('How do I appeal my punishment?')}</strong></h3>
		<p>
			{t(
				'To appeal your punishment, please direct message one of our moderators on our Discord. They will reach out to you, discussing your punishment and a more detailed appeal from your side.'
			)}
		</p>
	</section>
</div>
