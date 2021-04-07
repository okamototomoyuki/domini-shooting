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
			t1.translateScreenY(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyA")) {
			t1.translateScreenX(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyS")) {
			t1.translateScreenY(Engine.delta * 100);
		}
		if (Input.isPressing("KeyD")) {
			t1.translateScreenX(Engine.delta * 100);
		}
		if (Input.isPressing("KeyQ")) {
			t1.rotateZ(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyE")) {
			t1.rotateZ(Engine.delta * 100);
		}

		if (Input.isPressing("KeyI")) {
			t2.translateScreenY(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyJ")) {
			t2.translateScreenX(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyK")) {
			t2.translateScreenY(Engine.delta * 100);
		}
		if (Input.isPressing("KeyL")) {
			t2.translateScreenX(Engine.delta * 100);
		}
		if (Input.isPressing("KeyU")) {
			t2.rotateZ(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyO")) {
			t2.rotateZ(Engine.delta * 100);
		}
		if (Input.isPressing("KeyP")) {
			t3.rotateZ(-Engine.delta * 100);
		}
		if (Input.isPressing("BracketLeft")) {
			t3.rotateZ(Engine.delta * 100);
		}

		t1.loopAtScreen(Input.mousePosition);

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
		transform-origin: center;
		width: 320px;
		height: 256px;
		&.collision {
			background-color: red;
		}
	}
</style>
