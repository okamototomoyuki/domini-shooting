<script lang="ts">
	import { onMount } from "svelte";
</script>

<div>
	<h3 class:hide={isMsg == false} bind:this={hMsg}>読み込み中...</h3>
	<textarea class:hide={isMsg} bind:this={txtBody} on:input={_dirty} disabled>
		読み込み中...
	</textarea>
</div>

<style lang="scss">
</style>
