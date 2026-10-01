<script lang="ts">
	import '../app.postcss';
	import { initializeStores } from '@skeletonlabs/skeleton';

	// NOTE: skeleton stores must be initialized in the ROOT layout even
	// though this layout renders no chrome of its own — nerv pages use
	// getDrawerStore(), which throws without this.
	initializeStores();
</script>

<slot />
