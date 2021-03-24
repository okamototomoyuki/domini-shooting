<script lang="ts">
    import { onMount } from "svelte";
    import { get_custom_elements_slots } from "svelte/internal";
    import Transform from "../data/Transform";

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

<div bind:this={element} />

<style lang="scss">
    div {
        background-color: black;
        width: 320px;
        height: 256px;
        transform: rotate(45deg);
    }
</style>
