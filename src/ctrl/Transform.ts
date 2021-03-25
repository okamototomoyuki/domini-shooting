import { element } from "svelte/internal";
import Matrix from "../data/Matrix";
import Vector3 from "../data/Vector3";
import VertexData from "../data/VertexData";

/**
 * 矩形の Transform
 */
export default class Transform {

    isDirty = false;

    // ローカル変回値
    localPositionX = 0;
    localPositionY = 0;
    localScaleX = 1;
    localScaleY = 1;
    localRad = 0;

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
     * 座標X設定
     * @param x X座標
     */
    setLocalPositionX(x) {
        this.localPositionX = x;
        this.isDirty = true;
    }

    /**
     * 座標Y設定
     * @param y Y座標
     */
    setLocalPositionY(y) {
        this.localPositionY = y;
        this.isDirty = true;
    }

    /**
     * 座標指定
     * @param x X座標
     * @param y Y座標
     */
    setLocalPosition(x, y) {
        this.setLocalPositionX(x);
        this.setLocalPositionY(y);
    }

    /**
     * 回転設定
     * @param rad ラジアン
     */
    setLocalRotate(rad) {
        this.localRad = rad;
        this.isDirty = true;
    }

    /**
     * 拡縮X設定
     * @param x 拡縮X
     */
    setLocalScaleX(x) {
        this.localScaleX = x;
        this.isDirty = true;
    }

    /**
     * 拡縮Y設定
     * @param y 拡縮Y
     */
    setLocalScaleY(y) {
        this.localScaleY = y;
        this.isDirty = true;
    }

    /**
     * 拡縮設定
     * @param {number} x 拡縮X
     * @param {number} y 拡縮Y
     */
    setLocalScale(x, y) {
        this.setLocalScale(x, y);
    }

    patch() {
        if (this.isDirty) {
            this.node.setAttribute("style", `transform: translate(${this.translate.x}px, ${this.translate.y}px) rotate(${this.rotate.z}deg) scale(, )`);
        }
        this.isDirty = null;
    }
}