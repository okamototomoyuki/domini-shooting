<script lang="ts">
	import { onMount } from "svelte";
	import MEntity from "../engine/element/MEntity";
	import Engine from "../engine/Engine";
	import MComoponent from "../engine/component/MComponent";
	import Player from "./component/Player";
	import Gun from "./component/Gun";
	import Bullet from "./component/Bullet";

	let t1: MEntity;
	let t2: MEntity;

	onMount(() => {
		Engine.start();
		MComoponent.registerComponent("player", Player);
		MComoponent.registerComponent("gun", Gun);
		MComoponent.registerComponent("bullet", Bullet);
	});
</script>

<m-entity class="a" style="--w:50px;--h:50px;" bind:this={t1} player>
	<m-entity
		class="b"
		bind:this={t2}
		style="--w:25px;--h:25px;--x:37.5px;--y:12.5px"
		gun
	/>
</m-entity>

<style lang="scss">
	:global(m-entity) {
		transform: translate(var(--x, 0), var(--y, 0)) rotate(var(--r, 0))
			scaleX(var(--sx, 1)) scaleY(var(--sy, 1));
		position: absolute;
		transform-origin: center;
		width: var(--w, 320px);
		height: var(--h, 256px);
		background-color: var(--bg, black);
	}
</style>
