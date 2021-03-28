<script lang="ts">
	import { onMount } from "svelte";
	import Rect from "./component/Rect.svelte";

	let rect: Rect;
	let rect2: Rect;
	onMount(() => {
		loop();
	});
	const loop = () => {
		let t = rect?.getTransform();
		let t2 = rect2.getTransform();
		t.rotateX(1);
		// console.log(t.getRotate());

		t2.scaleX(1.001);
		console.log(t2.getScale());
		requestAnimationFrame(loop);
	};
</script>

<Rect bind:this={rect}>
	<Rect bind:this={rect2} />
</Rect>
