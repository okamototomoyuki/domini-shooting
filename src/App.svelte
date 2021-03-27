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
		t.setLocalRotate(t.localRotate + 1);

		let style = getComputedStyle(t.node);
		t2.setLocalPositionX(t2.localPositionX + 1);
		requestAnimationFrame(loop);
	};
</script>

<Rect bind:this={rect}>
	<Rect bind:this={rect2} />
</Rect>
