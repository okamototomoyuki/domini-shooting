<script lang="ts">
	import { onMount } from "svelte";
	import Transform from "./engine/ctrl/Transform";
	import Input from "./engine/data/Input";
	import Engine from "./engine/Engine";

	let rect: HTMLElement;
	let rect2: HTMLElement;
	let rect3: HTMLElement;

	let isCollision = false;
	onMount(() => {
		Engine.start();
		const t2 = Transform.getTransform(rect2);
		const t3 = Transform.getTransform(rect3);
		t2.translateX(330);
		t3.translateX(330);

		loop();
	});

	const loop = () => {
		const t1 = Transform.getTransform(rect);
		const t2 = Transform.getTransform(rect2);
		const t3 = Transform.getTransform(rect3);

		const d = Engine.delta;
		if (Input.isPressing("KeyW")) {
			t1.translateScreenY(-d * 100);
		}
		if (Input.isPressing("KeyA")) {
			t1.translateScreenX(-d * 100);
		}
		if (Input.isPressing("KeyS")) {
			t1.translateScreenY(d * 100);
		}
		if (Input.isPressing("KeyD")) {
			t1.translateScreenX(d * 100);
		}
		if (Input.isPressing("KeyQ")) {
			t1.addRotate(-d * 100);
		}
		if (Input.isPressing("KeyE")) {
			t1.addRotate(d * 100);
		}

		if (Input.isPressing("KeyI")) {
			t2.translateScreenY(-d * 100);
		}
		if (Input.isPressing("KeyJ")) {
			t2.translateScreenX(-d * 100);
		}
		if (Input.isPressing("KeyK")) {
			t2.translateScreenY(d * 100);
		}
		if (Input.isPressing("KeyL")) {
			t2.translateScreenX(d * 100);
		}
		if (Input.isPressing("KeyU")) {
			t2.addRotate(-d * 100);
		}
		if (Input.isPressing("KeyO")) {
			t2.addRotate(d * 100);
		}
		if (Input.isPressing("KeyP")) {
			t3.addRotate(-d * 100);
		}
		if (Input.isPressing("BracketLeft")) {
			t3.addRotate(d * 100);
		}

		t2.loopAtScreen(Input.mousePosition);

		isCollision = false;
		for (let e of t1.collides) {
			if (e.node == t3.node) {
				isCollision = true;
			}
		}

		requestAnimationFrame(loop);
	};
</script>

<div
	style="--w:320px;--h:256px;"
	bind:this={rect}
	class:collision={isCollision}
>
	<div bind:this={rect2}>
		<div bind:this={rect3} />
	</div>
</div>

<style lang="scss">
	div {
		transform: translate(var(--x, 0), var(--y, 0)) rotate(var(--r, 0))
			scaleX(var(--sx, 1)) scaleY(var(--sy, 1));
		position: absolute;
		background-color: black;
		transform-origin: center;
		width: var(--w, 320px);
		height: var(--h, 256px);
		&.collision {
			background-color: red;
		}
	}
</style>
