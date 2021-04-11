<script lang="ts">
	import { onMount } from "svelte";
	import MEntity from "../engine/component/MEntity";
	import Input from "../engine/data/Input";
	import Engine from "../engine/Engine";

	let t1: MEntity;
	let t2: MEntity;
	let t3: MEntity;

	let isCollision = false;
	onMount(() => {
		Engine.start();
		t2.x += 330;
		t3.x += 330;

		loop();
	});

	const loop = () => {
		console.log(MEntity.list.length);
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
			t1.r += -d * 100;
		}
		if (Input.isPressing("KeyE")) {
			t1.r += d * 100;
		}
		if (Input.isPressing("KeyZ")) {
			t1.sx -= d * 10;
		}
		if (Input.isPressing("KeyC")) {
			t1.sy -= d * 10;
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
			t2.r += -d * 100;
		}
		if (Input.isPressing("KeyO")) {
			t2.r += d * 100;
		}
		if (Input.isPressing("KeyP")) {
			t3.r += -d * 100;
		}
		if (Input.isPressing("BracketLeft")) {
			t3.r += d * 100;
		}

		t2.loopAtScreen(Input.mousePosition);

		isCollision = false;
		for (let e of t1.collides) {
			if (e == t3) {
				isCollision = true;
			}
		}

		requestAnimationFrame(loop);
	};
</script>

<m-entity
	class="a"
	style="--w:320px;--h:256px;"
	bind:this={t1}
	class:collin1={isCollision}
>
	<m-entity class="b" bind:this={t2}>
		<m-entity class="c" bind:this={t3} />
	</m-entity>
</m-entity>

<style lang="scss">
	m-entity {
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
