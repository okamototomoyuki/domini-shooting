<script lang="ts">
	import { onMount } from "svelte";
	import Rect from "./component/Rect.svelte";
	import Transform from "./ctrl/Transform";
	import Input from "./data/Input";
	import Matrix from "./data/Matrix";

	let rect: HTMLElement;
	let rect2: HTMLElement;
	let rect3: HTMLElement;

	let isCollision = false;
	onMount(() => {
		const t2 = Transform.getTransform(rect2);
		const t3 = Transform.getTransform(rect3);

		t2.translateX(350);
		t3.translateX(350);
		loop();
	});

	const loop = () => {
		const t1 = Transform.getTransform(rect);
		const t2 = Transform.getTransform(rect2);
		const t3 = Transform.getTransform(rect3);

		if (Input.isPressing("KeyW")) {
			t1.translateY(-1);
		}
		if (Input.isPressing("KeyA")) {
			t1.translateX(-1);
		}
		if (Input.isPressing("KeyS")) {
			t1.translateY(1);
		}
		if (Input.isPressing("KeyD")) {
			t1.translateX(1);
		}
		if (Input.isPressing("KeyQ")) {
			t1.rotate(-1);
		}
		if (Input.isPressing("KeyE")) {
			t1.rotate(1);
		}

		if (Input.isPressing("KeyI")) {
			t2.translateY(-1);
		}
		if (Input.isPressing("KeyJ")) {
			t2.translateX(-1);
		}
		if (Input.isPressing("KeyK")) {
			t2.translateY(1);
		}
		if (Input.isPressing("KeyL")) {
			t2.translateX(1);
		}
		if (Input.isPressing("KeyU")) {
			t2.rotate(-1);
		}
		if (Input.isPressing("KeyO")) {
			t2.rotate(1);
		}
		if (Input.isPressing("KeyP")) {
			t3.rotate(-1);
		}
		if (Input.isPressing("BracketLeft")) {
			t3.rotate(1);
		}

		isCollision = false;
		for (let e of t1.collides) {
			if (e.node == t3.node) {
				isCollision = true;
			}
		}

		requestAnimationFrame(loop);
	};
</script>

<div class="rect" bind:this={rect} class:collision={isCollision}>
	<div class="rect" bind:this={rect2}>
		<div class="rect" bind:this={rect3} />
	</div>
</div>

<style lang="scss">
	div.rect {
		position: absolute;
		background-color: black;
		width: 320px;
		height: 256px;
		&.collision {
			background-color: red;
		}
	}
</style>
