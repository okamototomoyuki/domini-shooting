<script lang="ts">
	import { onMount } from "svelte";
	import Rect from "./component/Rect.svelte";
	import Matrix from "./data/Matrix";

	let rect: Rect;
	let rect2: Rect;
	let rect3: Rect;
	onMount(() => {
		loop();
	});
	let rot = 1;
	const loop = () => {
		let t1 = rect?.getTransform();
		let t2 = rect2.getTransform();
		// let t3 = rect3.getTransform();
		t1.translateX(-0.1);
		t2.translateX(0.2);
		// t3.translateX(0.1);
		// console.log(t.getRotate());

		// t2.translateX(1.001);
		// console.log(t2.matrix);
		// console.log("=============");
		// console.log(t.getRotate());
		// console.log(t1.getTranslate());
		// console.log(t3.computeVertexData().a);
		// console.log(t3.computeVertexData().b);
		// console.log(t3.computeVertexData().c);
		// console.log(t3.computeVertexData().d);
		console.log(t1.collides);
		console.log(t2.collides);
		// console.log(t.computeVertexData().b);
		// console.log(t.computeVertexData().c);
		// console.log(t.computeVertexData().d);
		requestAnimationFrame(loop);
	};
</script>

<Rect bind:this={rect}>
	<Rect bind:this={rect2}>
		<Rect bind:this={rect3} />
	</Rect>
</Rect>
