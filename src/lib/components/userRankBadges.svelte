<script lang="ts">
	import { Privileges, privsToGroups } from '$lib/privs';
	import Award from 'svelte-feathers/Award.svelte';
	import BookOpen from 'svelte-feathers/BookOpen.svelte';
	import CheckCircle from 'svelte-feathers/CheckCircle.svelte';
	import Code from 'svelte-feathers/Code.svelte';
	import Heart from 'svelte-feathers/Heart.svelte';
	import Hexagon from 'svelte-feathers/Hexagon.svelte';
	import Map from 'svelte-feathers/Map.svelte';
	import Server from 'svelte-feathers/Server.svelte';
	import Shield from 'svelte-feathers/Shield.svelte';
	import { 
		Omega, 
		Trophy, 
		PawPrint, 
		Moon,
		Bot,
		Ban
	} from 'lucide-svelte'; // why dont just i use this ugghhhhh

	export let userPriv: number;
	export let userID: number;
	export let userRank: number;
	export let userMode: string;

	const groups = privsToGroups(userPriv);
</script>

<div class="flex flex-row gap-2 px-3 drop-shadow">

	<!-- Individual user badges -->
	<!-- kaupec || ano -->
	{#if userID === 16 || userID === 4}
		<div class="tooltip text-yellow-300" aria-label="Owner">
			<Omega class="w-4 md:w-6 pointer-events-none" />
		</div>
	{/if}
	
	<!-- kselon -->
	{#if userID === 13}
		<div class="tooltip text-pink-300" aria-label="Femboy">
			<PawPrint class="w-4 md:w-6 pointer-events-none" />
		</div>
	{/if}
	
	<!-- Misc -->
	<!-- og player -->
	{#if userID >= 3 && userID <= 15}
		<div class="tooltip text-green-300" aria-label="Here since the beginning">
			<Moon class="w-4 md:w-6 pointer-events-none" />
		</div>
	{/if}
	
	<!-- Asuka -->
	{#if userID === 1}
		<div class="tooltip text-cyan-300" aria-label="Bot">
			<Bot class="w-4 md:w-6 pointer-events-none" />
		</div>
	{/if}
	
	<!-- Restricted Players (ok what is this check)-->
	{#if !Privileges.UNRESTRICTED || userPriv == 1 << 1}
		<div class="tooltip text-grey-300" aria-label="Restricted">
			<Ban class="w-4 md:w-6 pointer-events-none" />
		</div>
	{/if}

	<!-- Special case for #1 Player -->
	<!-- maybe shouldnt handle it like this? i need to rework this -->
	{#if userRank === 1}
		<div class="tooltip text-blue-300 numba1" aria-label="re;fx {userMode} Champion">
			<Trophy class="w-4 md:w-6 pointer-events-none numba1" />
		</div>
	{/if}

	<!-- Privs -->
	{#each groups as group}
		{#if group == Privileges.ADMINISTRATOR}
			<div class="tooltip text-red-600" aria-label="Administrator">
				<Shield class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.MODERATOR}
			<div class="tooltip text-rose-700" aria-label="Moderator">
				<Server class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.DEVELOPER}
			<div class="tooltip text-blue-500" aria-label="Developer">
				<Code class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.ALUMNI}
			<div class="tooltip text-blue-500" aria-label="Alumni">
				<BookOpen class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.NOMINATOR}
			<div class="tooltip text-green-500" aria-label="Nominator">
				<Map class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.TOURNEY_MANAGER}
			<div class="tooltip text-amber-500" aria-label="Tourney Manager">
				<Award class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.PREMIUM}
			<div class="tooltip text-amber-600" aria-label="Donator">
				<Hexagon class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.SUPPORTER}
			<div class="tooltip text-pink-500" aria-label="Donator">
				<Heart class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
		{#if group == Privileges.WHITELISTED}
			<div class="tooltip text-green-400" aria-label="Verified">
				<CheckCircle class="w-4 md:w-6 pointer-events-none" />
			</div>
		{/if}
	{/each}
</div>

<!-- W oghuhfaufognhaslglgn -->
<style>
	.numba1 {
		animation: glow-animation 1.5s infinite alternate;
	}
	
	@keyframes glow-animation {
		0% {
			text-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff;
		}
		100% {
			text-shadow: 0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #00d4ff;
		}
	}
</style>