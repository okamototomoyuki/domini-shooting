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
		スコア: {Game.score}
	</p>
	<p>
		WASD : 移動<br />
		マウス移動 : 回転<br />
		左クリック : 弾発射<br />
	</p>
	<p>
		<b>
			{#if Game.isStateWaiting}
				スペース: ゲーム開始
			{:else if Game.isStatePlaying}
				敵を撃て！
			{:else}
				スペース：最初から
			{/if}
		</b>
	</p>
	<p>
		<a href="/">ミニゲー</a>
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
