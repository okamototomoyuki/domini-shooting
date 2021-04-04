import Vector3 from "../data/Vector3";
import type Transform from "./Transform";

export default class Vertex {

    static TYPE_ORIGIN = 0;
    static TYPE_LT = 1;
    static TYPE_RT = 2;
    static TYPE_RB = 3;
    static TYPE_LB = 4;
    static TYPE_TOP = 5;
    static TYPE_RIGHT = 6;
    static TYPE_BOTTOM = 7;
    static TYPE_LEFT = 8;

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
        node.style.transformOrigin = "center";
        node.style.opacity = "0";
        node.style.width = "1px";
        node.style.height = "1px";

        this.rebuild();
    }

    rebuild() {
        switch (this.type) {
            case Vertex.TYPE_ORIGIN:
                this.node.style.transform = `translate(${this.trans.node.offsetWidth / 2}px, ${this.trans.node.offsetHeight / 2}px)`;
                break;
            case Vertex.TYPE_LT:
                this.node.style.transform = "translate(0px, 0px)";
                break;
            case Vertex.TYPE_RT:
                this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, 0px)`;
                break;
            case Vertex.TYPE_RB:
                this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, ${this.trans.node.offsetHeight}px)`;
                break;
            case Vertex.TYPE_LB:
                this.node.style.transform = `translate(0px, ${this.trans.node.offsetHeight}px)`;
                break;

            case Vertex.TYPE_TOP:
                this.node.style.transform = `translate(${this.trans.node.offsetWidth / 2}px, 0px)`;
                break;
            case Vertex.TYPE_RIGHT:
                this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, ${this.trans.node.offsetHeight / 2}px)`;
                break;
            case Vertex.TYPE_BOTTOM:
                this.node.style.transform = `translate(${this.trans.node.offsetWidth / 2}px, ${this.trans.node.offsetHeight}px)`;
                break;
            case Vertex.TYPE_LEFT:
                this.node.style.transform = `translate(0px, ${this.trans.node.offsetHeight / 2}px)`;
                break;
        }
    }

    getPosition(): Vector3 {
        let bound = this.node.getBoundingClientRect();
        return new Vector3(bound.x, bound.y, 0);
    }
}