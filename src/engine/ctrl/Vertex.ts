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

        const style = this.node.style;
        switch (this.type) {
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
    }

    get positionScreen(): Vector2 {
        let bound = this.node.getBoundingClientRect();
        return new Vector2(bound.x, bound.y);
    }
}