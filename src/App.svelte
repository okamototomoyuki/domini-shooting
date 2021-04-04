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

		loop();
	});

	const loop = () => {
		const t1 = Transform.getTransform(rect);
		const t2 = Transform.getTransform(rect2);
		const t3 = Transform.getTransform(rect3);

		if (Input.isPressing("KeyW")) {
			t1.translateY(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyA")) {
			t1.translateX(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyS")) {
			t1.translateY(Engine.delta * 100);
		}
		if (Input.isPressing("KeyD")) {
			t1.translateX(Engine.delta * 100);
		}
		if (Input.isPressing("KeyQ")) {
			t1.rotate(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyE")) {
			t1.rotate(Engine.delta * 100);
		}

		if (Input.isPressing("KeyI")) {
			t2.translateY(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyJ")) {
			t2.translateX(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyK")) {
			t2.translateY(Engine.delta * 100);
		}
		if (Input.isPressing("KeyL")) {
			t2.translateX(Engine.delta * 100);
		}
		if (Input.isPressing("KeyU")) {
			t2.rotate(-Engine.delta * 100);
		}
		if (Input.isPressing("KeyO")) {
			t2.rotate(Engine.delta * 100);
		}
		if (Input.isPressing("KeyP")) {
			t3.rotate(-Engine.delta * 100);
		}
		if (Input.isPressing("BracketLeft")) {
			t3.rotate(Engine.delta * 100);
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
		// position: absolute;
		background-color: black;
		width: 320px;
		height: 256px;
		&.collision {
			background-color: red;
		}
	}
</style>
