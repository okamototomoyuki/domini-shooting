import Vector2 from "../data/Vector2";
import type Transform from "./Transform";

export default class Vertex {

    static TYPE_LT = 0;
    static TYPE_RT = 1;
    static TYPE_RB = 2;
    static TYPE_LB = 3;

    static nodeToIns = new Map<HTMLDivElement, Vertex>();

    trans: Transform;
    node: HTMLDivElement;
    type: number

    constructor(trans: Transform, type: number) {
        this.trans = trans;

        const node = document.createElement('div')
        this.node = node;
        this.type = type;
        this.trans.node.appendChild(this.node);
        node.style.position = "absolute";
        node.style.width = "0px";
        node.style.height = "0px";

        this.rebuild();
    }

    rebuild() {
        var style = getComputedStyle(this.trans.node)
        switch (this.type) {
            case Vertex.TYPE_LT:
                this.node.style.transform = "translate(0px, 0px)";
                break;
            case Vertex.TYPE_RT:
                this.node.style.transform = `translate(${style.width}, 0px)`;
                break;
            case Vertex.TYPE_RB:
                this.node.style.transform = `translate(${style.width}, ${style.height})`;
                break;
            case Vertex.TYPE_LB:
                this.node.style.transform = `translate(0px, ${style.height})`;
                break;
        }
    }

    get positionScreen(): Vector2 {
        let bound = this.node.getBoundingClientRect();
        return new Vector2(bound.x, bound.y);
    }
}