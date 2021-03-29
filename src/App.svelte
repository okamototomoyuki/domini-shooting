<script lang="ts">
	import { onMount } from "svelte";
	import Rect from "./component/Rect.svelte";
	import Matrix from "./data/Matrix";

	let rect: Rect;
	let rect2: Rect;
	onMount(() => {
		loop();
	});
	let rot = 1;
	const loop = () => {
		let t = rect?.getTransform();
		let t2 = rect2.getTransform();
		rot += 0.1;
		t.rotateY(0.1);
		// console.log(t.getRotate());

		// t2.translateX(1.001);
		// console.log(t2.matrix);
		console.log(rot + " " + t.getRotate().y);
		requestAnimationFrame(loop);
	};
</script>

<Rect bind:this={rect}>
	<Rect bind:this={rect2} />
</Rect>
