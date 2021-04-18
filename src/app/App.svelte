<script lang="ts">
	import { onMount } from "svelte";
	import MEntity from "../engine/element/MEntity";
	import Engine from "../engine/Engine";
	import MComoponent from "../engine/component/MComponent";
	import Player from "./component/Player";
	import Gun from "./component/Gun";
	import Bullet from "./component/Bullet";
	import Enemy from "./component/Enemy";

	let generateTime = 0;
	let generateSpan = 3;

	onMount(() => {
		Engine.start();
		MComoponent.registerComponent("player", Player);
		MComoponent.registerComponent("gun", Gun);
		MComoponent.registerComponent("bullet", Bullet);
		MComoponent.registerComponent("enemy", Enemy);

		Player.generate();
		generateTime = generateSpan;
		requestAnimationFrame(loop);
	});

	const loop = () => {
		const player = Player.instance;
		if (player && player.isReady) {
			generateTime += Engine.delta;
			if (generateTime > generateSpan) {
				Enemy.generate();
				generateTime = 0;
				generateSpan = Math.max(generateSpan - 0.2, Gun.SPAN * 0.99);
			}
		}
		requestAnimationFrame(loop);
	};
</script>

<style lang="scss">
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
