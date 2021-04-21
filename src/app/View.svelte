<script lang="ts">
	import { onMount } from "svelte";
	import Game from "./Game";

	export const reload = () => {
		Game.score = Game.score;
	};

	onMount(() => {});
</script>

<div>
	<h1>DOM Shooting Game</h1>
	<p>
		Score: {Game.score}
	</p>
	<p>
		WASD : Move<br />
		Mouse Move : Aim<br />
		Click : Shoot<br />
	</p>
	<p>
		<b>
			{#if Game.isStateWaiting}
				Space: Game Start
			{:else if Game.isStatePlaying}
				Shoot the enemy!
			{:else}
				Space：Restart
			{/if}
		</b>
	</p>
</div>

<style lang="scss">
	:global(body) {
		overflow: hidden;
		user-select: none;
	}
	:global(m-entity) {
		transform: translate(var(--x, 0), var(--y, 0)) rotate(var(--rad, 0))
			scaleX(var(--sx, 1)) scaleY(var(--sy, 1));
		position: absolute;
		transform-origin: center;
		width: var(--w, 320px);
		height: var(--h, 256px);
		background-color: var(--bg, black);
	}
</style>
