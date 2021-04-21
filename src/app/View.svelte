<script lang="ts">
	import { onMount } from "svelte";
	import Game from "./Game";

	onMount(() => {});
</script>

<div class:hidden={Game.isStateWaiting == false}>
	<h1>DOM Shooting Game</h1>
	<p>
		Score: {Game.score}
	</p>
	<p>
		WASD : Move<br />
		Mouse Move : Aim<br />
		Click : Shoot<br />
	</p>
	<p class:hidden={Game.isStateWaiting == false}><b>Space: Game Start</b></p>
	<p class:hidden={Game.isStateEnding == false}><b>Space：Restart</b></p>
</div>

<style lang="scss">
	.hidden {
		display: none;
	}
	:global(body) {
		overflow: hidden;
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
