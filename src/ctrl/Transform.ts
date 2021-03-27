import { element, loop } from "svelte/internal";
import Matrix from "../data/Matrix";
import Vector3 from "../data/Vector3";
import VertexData from "../data/VertexData";

/**
 * 矩形の Transform
 */
export default class Transform {

    static nodeToIns = new Map<HTMLElement, Transform>();
    static currentFrame = 0;
    static isInit = false;

    static getTransform(node: HTMLElement) {
        if (this.isInit == false) {
            this.isInit = true;
            this.loop();
        }
        let t = Transform.nodeToIns.get(node)
        if (t != null) {
            return t;
        } else {
            t = new Transform(node)
            Transform.nodeToIns.set(node, t);
            return t;
        }
    }

    static loop() {
        Transform.currentFrame = Transform.currentFrame + 1;
        for (const e of Transform.nodeToIns.values()) {
            e.patch();
        }
        requestAnimationFrame(Transform.loop);
    }

    node: HTMLElement;
    matrix: Matrix;

    frame = 0;
    localPositionX = 0;
    localPositionY = 0;
    localRotate = 0;
    localScaleX = 1;
    localScaleY = 1;
    isDirty = false;

    constructor(node: HTMLElement) {
        this.node = node;
    }

    rebuildMatrix() {
        if (this.frame != Transform.currentFrame) {
            const computedStyle = getComputedStyle(this.node, null);
            const transStyle = computedStyle.transform
            this.matrix = Matrix.parse(transStyle);
            this.frame = Transform.currentFrame;
        }
    }

    get rotate(): Vector3 {
        this.rebuildMatrix();
        let rotateY = Math.asin(-this.matrix.m13);
        let rotateX = Math.atan2(this.matrix.m23, this.matrix.m33)
        let rotateZ = Math.atan2(this.matrix.m12, this.matrix.m11)
        return new Vector3(rotateX, rotateY, rotateZ);
    }

    get translate(): Vector3 {
        this.rebuildMatrix();
        return new Vector3(this.matrix.m41, this.matrix.m42, this.matrix.m43);
    }

    // /**
    //  * 頂点データ計算
    //  * @returns 頂点データ
    //  */
    // computeVertexData(): VertexData {
    //     let w = this.node.offsetWidth;
    //     let h = this.node.offsetHeight;
    //     let v = new VertexData(
    //         new Vector3(-w / 2, -h / 2, 0),
    //         new Vector3(w / 2, -h / 2, 0),
    //         new Vector3(w / 2, h / 2, 0),
    //         new Vector3(-w / 2, h / 2, 0),
    //     );

    //     let node: HTMLElement = this.node;
    //     let transform: Transform = null;
    //     while (node.nodeType === 1) {
    //         transform = Transform.getTransform(node);
    //         v.a = v.a.rotateVector(transform.rotate).addVectors(transform.translate);
    //         v.b = v.b.rotateVector(transform.rotate).addVectors(transform.translate);
    //         v.c = v.c.rotateVector(transform.rotate).addVectors(transform.translate);
    //         v.d = v.d.rotateVector(transform.rotate).addVectors(transform.translate);
    //         node = transform.parentNode;
    //     }
    //     return v;
    // };


    // /**
    //  * 親ノード取得
    //  */
    // get parentNode(): HTMLElement {
    //     return this.node.parentNode as HTMLElement;
    // }

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
        this.localRotate = rad;
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
            this.node.setAttribute("style", `
transform: translate(${this.localPositionX}px, ${this.localPositionY}px) rotate(${this.localRotate}deg) scale(${this.localScaleX}, ${this.localScaleY})
            `);
        }
        this.isDirty = false;
    }
}