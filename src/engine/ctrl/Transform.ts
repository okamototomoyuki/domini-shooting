import { element, loop } from "svelte/internal";
import Matrix from "../data/Matrix";
import Vector3 from "../data/Vector3";
import VertexData from "../data/VertexData";
import Vertex from "./Vertex";

/**
 * 矩形の Transform
 */
export default class Transform {

    static nodeToIns = new Map<HTMLElement, Transform>();
    static currentFrame = 0;

    static initialize() {
        this.update();
    }

    static update() {
        Transform.currentFrame = Transform.currentFrame + 1;
        for (const e of Transform.nodeToIns.values()) {
            e.patch();
        }
    }

    static getTransform(node: HTMLElement) {
        this.initialize();
        let t = Transform.nodeToIns.get(node)
        if (t != null) {
            return t;
        } else {
            t = new Transform(node)
            Transform.nodeToIns.set(node, t);
            return t;
        }
    }


    node: HTMLElement;
    matrix: Matrix;
    vertices: Vertex[];

    frame = 0;
    isDirty = false;

    constructor(node: HTMLElement) {
        this.node = node;
        this.vertices = [new Vertex(this, 0), new Vertex(this, 1), new Vertex(this, 2), new Vertex(this, 3)];
    }

    rebuildMatrix() {
        if (this.frame != Transform.currentFrame) {
            const computedStyle = getComputedStyle(this.node, null);
            this.matrix = Matrix.fromString(computedStyle.transform);
            this.frame = Transform.currentFrame;
        }
    }

    getWorldMatrix(): Matrix {
        let node = this.node;
        this.rebuildMatrix();
        let wm = this.matrix;

        node = this.parentNode;
        while (node.nodeType === 1) {
            let transform = Transform.getTransform(node);
            transform.rebuildMatrix();
            let pm = transform.matrix;
            wm = Matrix.multiply(pm, wm);
            node = transform.parentNode;
        }
        return wm;
    }

    getTranslate(): Vector3 {
        this.rebuildMatrix();
        return this.matrix.getTranslate();
    }

    getRotate(): Vector3 {
        this.rebuildMatrix();
        return this.matrix.getRotate();
    }

    getScale() {
        this.rebuildMatrix();
        return this.matrix.getScale();
    }

    getWorldTranslate(): Vector3 {
        return this.getWorldMatrix().getTranslate();
    }

    getWorldRotate(): Vector3 {
        return this.getWorldMatrix().getTranslate();
    }

    getWorldScale(): Vector3 {
        return this.getWorldMatrix().getScale();
    }

    /**
     * 画面に対しての頂点データ計算
     * @returns 頂点データ
     */
    computeVertex2D(): VertexData {
        // 計算しない　、 頂点 DOM を持たせて、 getBoundClientRect で座標を得る
        return new VertexData(this.vertices[0].getPosition(),
            this.vertices[1].getPosition(),
            this.vertices[2].getPosition(),
            this.vertices[3].getPosition());
    };

    /**
     * 親ノード取得
     */
    get parentNode(): HTMLElement {
        return this.node.parentNode as HTMLElement;
    }

    /**
     * 衝突した対象一覧
     */
    get collides(): Transform[] {

        const selfVs = this.computeVertex2D();
        const oVecs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];

        const collides = new Array<Transform>();
        for (const otherT of Transform.nodeToIns.values()) {
            if (otherT != this) {
                const otherVs = otherT.computeVertex2D();

                // 線分が交わっているか
                let isCollide = false;
                if (Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.a, otherVs.b)
                    || Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.b, otherVs.c)
                    || Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.c, otherVs.d)
                    || Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.d, otherVs.a)
                    || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.a, otherVs.b)
                    || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.b, otherVs.c)
                    || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.c, otherVs.d)
                    || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.d, otherVs.a)
                    || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.a, otherVs.b)
                    || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.b, otherVs.c)
                    || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.c, otherVs.d)
                    || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.d, otherVs.a)
                    || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.a, otherVs.b)
                    || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.b, otherVs.c)
                    || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.c, otherVs.d)
                    || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.d, otherVs.a)) {

                    isCollide = true;
                } else {
                    // 点が矩形内に入っているか
                    for (const oVec of oVecs) {
                        const otherVA = otherVs.a.addVectors(oVec);
                        const otherVB = otherVs.b.addVectors(oVec);
                        const otherVC = otherVs.c.addVectors(oVec);
                        const otherVD = otherVs.d.addVectors(oVec);

                        const crossAB = Vector3.cross(otherVA, otherVB);
                        const crossBC = Vector3.cross(otherVB, otherVC);
                        const crossCD = Vector3.cross(otherVC, otherVD);
                        const crossDA = Vector3.cross(otherVD, otherVA);
                        if (crossAB.z * crossBC.z > 0
                            && crossBC.z * crossCD.z > 0
                            && crossCD.z * crossDA.z > 0
                            && crossDA.z * crossAB.z > 0) {

                            isCollide = true;
                            break;
                        }
                    }
                }

                if (isCollide) {
                    collides.push(otherT);
                }
            }
        }
        return collides;
    }

    setTranslate(v: Vector3) {
        this.rebuildMatrix();
        this.matrix.setTranslate(v);
        this.isDirty = true;
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