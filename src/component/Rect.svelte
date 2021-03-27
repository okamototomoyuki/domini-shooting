<script lang="ts">
    import { onMount } from "svelte";
    import Transform from "../ctrl/Transform";

    let element: HTMLDivElement;
    let transform: Transform;

    export const getElement = () => {
        return element;
    };
    export const getTransform = () => {
        return transform;
    };

    onMount(() => {
        transform = Transform.getTransform(element);
    });
</script>

<div bind:this={element}><slot /></div>

<style lang="scss">
    div {
        background-color: black;
        width: 320px;
        height: 256px;
    }
</style>
