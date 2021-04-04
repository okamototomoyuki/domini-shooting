import Vector3 from "../data/Vector3";
import type Transform from "./Transform";

export default class Vertex {

    static nodeToIns = new Map<HTMLDivElement, Vertex>();

    trans: Transform;
    node: HTMLDivElement;
    index: number

    constructor(trans: Transform, index: number) {
        this.trans = trans;

        const node = document.createElement('div')
        this.node = node;
        this.index = index;
        this.trans.node.appendChild(this.node);
        node.style.position = "absolute";
        node.style.opacity = "0";
        node.style.width = "1px";
        node.style.height = "1px";

        this.rebuild();
    }

    rebuild() {
        if (this.index < 2) {
            if (this.index == 0) {
                this.node.style.transform = "translate(0px, 0px)";
            } else {
                this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, 0px)`;
            }
        } else {
            if (this.index == 2) {
                this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, ${this.trans.node.offsetHeight}px)`;
            } else {
                this.node.style.transform = `translate(0px, ${this.trans.node.offsetHeight}px)`;
            }
        }
    }

    getPosition(): Vector3 {
        let bound = this.node.getBoundingClientRect();
        return new Vector3(bound.x, bound.y, 0);
    }
}