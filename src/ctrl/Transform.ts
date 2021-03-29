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
    isDirty = false;

    constructor(node: HTMLElement) {
        this.node = node;
    }

    rebuildMatrix() {
        if (this.frame != Transform.currentFrame) {
            const computedStyle = getComputedStyle(this.node, null);
            this.matrix = Matrix.fromString(computedStyle.transform);
            this.frame = Transform.currentFrame;
        }
    }

    getRotate(): Vector3 {
        this.rebuildMatrix();
        return this.matrix.getRotate();
    }

    getTranslate(): Vector3 {
        this.rebuildMatrix();
        return this.matrix.getTranslate();
    }

    getScale() {
        this.rebuildMatrix();
        return this.matrix.getScale();
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
            const rot = transform.getRotate()
            const trans = transform.getTranslate();
            v.a = v.a.rotateVector(rot).addVectors(trans);
            v.b = v.b.rotateVector(rot).addVectors(trans);
            v.c = v.c.rotateVector(rot).addVectors(trans);
            v.d = v.d.rotateVector(rot).addVectors(trans);
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
    translateX(x) {
        this.rebuildMatrix();
        this.matrix = this.matrix.translateX(x);
        this.isDirty = true;
    }

    /**
     * 座標Y設定
     * @param y Y座標
     */
    translateY(y) {
        this.rebuildMatrix();
        this.matrix = this.matrix.translateY(y);
        this.isDirty = true;
    }

    /**
     * 座標指定
     * @param x X座標
     * @param y Y座標
     */
    translate(x, y) {
        this.rebuildMatrix();
        this.matrix = this.matrix.translate(x, y)
        this.isDirty = true;
    }

    /**
     * 回転設定
     * @param angle ラジアン
     */
    rotate(angle) {
        this.rebuildMatrix();
        this.matrix = this.matrix.rotate(angle);
        this.isDirty = true;
    }

    /**
     * X回転設定
     * @param angle ラジアン
     */
    rotateX(angle) {
        this.rebuildMatrix();
        this.matrix = this.matrix.rotateX(angle);
        this.isDirty = true;
    }

    /**
     * Y回転設定
     * @param angle ラジアン
     */
    rotateY(angle) {
        this.rebuildMatrix();
        this.matrix = this.matrix.rotateY(angle);
        this.isDirty = true;
    }

    /**
     * Y回転設定
     * @param angle ラジアン
     */
    rotateZ(angle) {
        this.rebuildMatrix();
        this.matrix = this.matrix.rotateZ(angle);
        this.isDirty = true;
    }

    /**
     * 拡縮X設定
     * @param x 拡縮X
     */
    scaleX(x) {
        this.rebuildMatrix();
        this.matrix = this.matrix.scaleX(x);
        this.isDirty = true;
    }

    /**
     * 拡縮Y設定
     * @param y 拡縮Y
     */
    scaleY(y) {
        this.rebuildMatrix();
        this.matrix = this.matrix.scaleY(y);
        this.isDirty = true;
    }

    /**
     * 拡縮Y設定
     * @param y 拡縮Y
     */
    scaleZ(z) {
        this.rebuildMatrix();
        this.matrix = this.matrix.scaleZ(z);
        this.isDirty = true;
    }

    /**
     * 拡縮設定
     * @param {number} x 拡縮X
     * @param {number} y 拡縮Y
     */
    scale(x, y) {
        this.rebuildMatrix();
        this.matrix = this.matrix.scale(x, y);
        this.isDirty = true;
    }

    patch() {
        if (this.isDirty) {
            this.node.setAttribute("style", `transform: ${this.matrix.toString()}`);
        }
        this.isDirty = false;
    }
}