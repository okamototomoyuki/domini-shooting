import Vector2 from "../data/Vector2";
import type MEntity from "./MEntity"

export default class Vertex extends HTMLElement {

    static TYPE_LT = 0;
    static TYPE_RT = 1;
    static TYPE_RB = 2;
    static TYPE_LB = 3;

    static new(trans: MEntity, type: number): Vertex {
        const node = document.createElement('m-vertex') as Vertex
        trans.appendChild(node);

        const style = node.style;
        style.position = "absolute";
        style.width = "0px";
        style.height = "0px";

        switch (type) {
            case Vertex.TYPE_LT:
                break;
            case Vertex.TYPE_RT:
                style.left = "100%";
                break;
            case Vertex.TYPE_RB:
                style.top = "100%";
                style.left = "100%";
                break;
            case Vertex.TYPE_LB:
                style.top = "100%";
                break;
        }
        return node;
    }

    get positionScreen(): Vector2 {
        const bound = this.getBoundingClientRect();
        return new Vector2(bound.x, bound.y);
    }
}

customElements.define("m-vertex", Vertex);