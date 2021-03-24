<script lang="ts">
	import { onMount } from "svelte";
	import Rect from "./component/Rect.svelte";

	let rect: Rect;
	onMount(() => {
		loop();
	});
	const loop = () => {
		let t = rect.getTransform();
		let style = getComputedStyle(t.node);
		// var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
		console.log("p:" + style.transform);
		requestAnimationFrame(loop);
	};
</script>

<Rect bind:this={rect} />
