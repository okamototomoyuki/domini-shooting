import { element } from "svelte/internal";
import Matrix from "./Matrix";
import Vector3 from "./Vector3";
import VertexData from "./VertexData";

/**
 * 矩形の Transform
 */
export default class Transform {

    constructor(public node: HTMLElement, public transformStyle: String, public matrix: Matrix, public rotate: Vector3, public translate: Vector3) { }

    static getTransform(node: HTMLElement) {
        let computedStyle = getComputedStyle(node, null);
        let val = computedStyle.transform
        let matrix = Matrix.parse(val);
        let rotateY = Math.asin(-matrix.m13);
        let rotateX = Math.atan2(matrix.m23, matrix.m33)
        let rotateZ = Math.atan2(matrix.m12, matrix.m11)

        return new Transform(
            node,
            val,
            matrix,
            new Vector3(
                rotateX,
                rotateY,
                rotateZ,
            ),
            new Vector3(
                matrix.m41,
                matrix.m42,
                matrix.m43
            )
        );
    }

    /**
     * 頂点データ計算
     * @returns 頂点データ
     */
    computeVertexData(): VertexData {
        let w = this.node.offsetWidth;
        let h = this.node.offsetHeight;
        let v = new VertexData(
            new Vector3(-w / 2, -h / 2, 0),
            new Vector3(w / 2, -h / 2, 0),
            new Vector3(w / 2, h / 2, 0),
            new Vector3(-w / 2, h / 2, 0),
        );

        let node: HTMLElement = this.node;
        let transform: Transform = null;
        while (node.nodeType === 1) {
            transform = Transform.getTransform(node);
            v.a = v.a.rotateVector(transform.rotate).addVectors(transform.translate);
            v.b = v.b.rotateVector(transform.rotate).addVectors(transform.translate);
            v.c = v.c.rotateVector(transform.rotate).addVectors(transform.translate);
            v.d = v.d.rotateVector(transform.rotate).addVectors(transform.translate);
            node = transform.parentNode;
        }
        return v;
    };


    /**
     * 親ノード取得
     */
    get parentNode(): HTMLElement {
        return this.node.parentNode as HTMLElement;
    }

    /**
     * 回転
     * @param rot ラジアン
     */
    setRotate(rot) {
    }

    buildStyle() {
        this.node.setAttribute("style", `transform: translate(${this.translate.x}px, ${this.translate.y}px) rotate(${this.rotate.z}deg) scale(, )`);
    }
}