import { element, loop } from "svelte/internal";
import Vector2 from "../data/Vector2";
import VertexData from "../data/VertexData";
import Engine from "../Engine";
import Vertex from "./Vertex";

/**
 * 矩形の Transform
 */
export default class Transform {

    static nodeToIns = new Map<HTMLElement, Transform>();

    static initialize() {
        this.update();
    }

    static update() {
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
    vertices: Vertex[];

    #x = 0;
    #y = 0;
    #r = 0;
    #sx = 1;
    #sy = 1;
    #w = 100;
    #h = 100;

    frame = 0;
    isDirty = false;

    constructor(node: HTMLElement) {
        this.node = node;
        this.vertices = [
            new Vertex(this, Vertex.TYPE_ORIGIN),
            new Vertex(this, Vertex.TYPE_LT),
            new Vertex(this, Vertex.TYPE_RT),
            new Vertex(this, Vertex.TYPE_RB),
            new Vertex(this, Vertex.TYPE_LB),
            new Vertex(this, Vertex.TYPE_TOP),
            new Vertex(this, Vertex.TYPE_RIGHT),
            new Vertex(this, Vertex.TYPE_BOTTOM),
            new Vertex(this, Vertex.TYPE_LEFT),
        ];
    }

    rebuildMatrix() {
        if (this.frame != Engine.currentFrame) {
            // const computedStyle = getComputedStyle(this.node, null);
            // this.matrix = Matrix.fromString(computedStyle.transform);
            var style = this.node.style;
            const x = style.getPropertyValue("--x");
            const y = style.getPropertyValue("--y");
            const r = style.getPropertyValue("--r");
            const sx = style.getPropertyValue("--sx");
            const sy = style.getPropertyValue("--sy");
            const w = style.getPropertyValue("--w");
            const h = style.getPropertyValue("--h");
            this.#x = x ? Number(x.replace("px", "")) : this.#x;
            this.#y = y ? Number(y.replace("px", "")) : this.#y;
            this.#r = r ? Number(r.replace("deg", "")) : this.#r;
            this.#sx = sx ? Number(sx) : this.#sx;
            this.#sy = sy ? Number(sy) : this.#sy;
            this.#w = w ? Number(w.replace("px", "")) : this.#w;
            this.#h = h ? Number(h.replace("px", "")) : this.#h;
            this.frame = Engine.currentFrame;
        }
    }

    get x(): number {
        this.rebuildMatrix();
        return this.#x;
    }
    set x(x: number) {
        this.rebuildMatrix();
        this.#x = x;
        this.isDirty = true;
    }
    get y(): number {
        this.rebuildMatrix();
        return this.#y;
    }
    set y(y: number) {
        this.rebuildMatrix();
        this.#y = y;
        this.isDirty = true;
    }
    get r(): number {
        this.rebuildMatrix();
        return this.#r;
    }
    set r(r: number) {
        this.rebuildMatrix();
        this.#r = r;
        this.isDirty = true;
    }
    get sx(): number {
        this.rebuildMatrix();
        return this.#sx;
    }
    set sx(sx: number) {
        this.rebuildMatrix();
        this.#sx = sx;
        this.isDirty = true;
    }
    get sy(): number {
        this.rebuildMatrix();
        return this.#sy;
    }
    set sy(sy: number) {
        this.rebuildMatrix();
        this.#sy = sy;
        this.isDirty = true;
    }
    get w(): number {
        this.rebuildMatrix();
        return this.#w;
    }
    set w(w: number) {
        this.rebuildMatrix();
        this.#w = w;
        this.isDirty = true;
    }
    get h(): number {
        this.rebuildMatrix();
        return this.#h;
    }
    set h(h: number) {
        this.rebuildMatrix();
        this.#h = h;
        this.isDirty = true;
    }
    get position(): Vector2 {
        this.rebuildMatrix();
        return new Vector2(this.#x, this.#y);
    }
    set position(v: Vector2) {
        this.rebuildMatrix();
        this.#x = v.x;
        this.#y = v.y;
        this.isDirty = true;
    }
    setPosition(x: number, y: number) {
        this.rebuildMatrix();
        this.#x = x;
        this.#y = y;
        this.isDirty = true;
    }
    get scale(): Vector2 {
        this.rebuildMatrix();
        return new Vector2(this.#sx, this.#sy);
    }
    set scale(v: Vector2) {
        this.rebuildMatrix();
        this.#sx = v.x;
        this.#sy = v.y;
        this.isDirty = true;
    }
    setScale(sx: number, sy: number) {
        this.rebuildMatrix();
        this.#sx = sx;
        this.#sy = sy;
        this.isDirty = true;
    }

    get positionScreen(): Vector2 {
        return this.vertices[Vertex.TYPE_ORIGIN].positionScreen;
    }

    get rotateScreen(): number {
        const vec = this.vertices[Vertex.TYPE_RIGHT].positionScreen.addVectors(this.vertices[Vertex.TYPE_ORIGIN].positionScreen.multiply(-1));
        return Math.atan2(vec.y, vec.x);
    }

    get scaleScreenX(): number {
        const vec = this.vertices[Vertex.TYPE_RIGHT].positionScreen.addVectors(this.vertices[Vertex.TYPE_LEFT].positionScreen.multiply(-1));
        return vec.distance / this.node.offsetWidth;
    }

    get scaleScreenY(): number {
        const vec = this.vertices[Vertex.TYPE_BOTTOM].positionScreen.addVectors(this.vertices[Vertex.TYPE_TOP].positionScreen.multiply(-1));
        return vec.distance / this.node.offsetHeight;
    }

    /**
     * ローカル座標X移動
     * @param dx X座標
     */
    translateX(dx: number) {
        this.x += dx;
    }

    /**
     * ローカル座標Y移動
     * @param dy Y座標
     */
    translateY(dy: number) {
        this.y += this.y + dy;
    }

    /**
     * 座標移動
     * @param dx X座標
     * @param dy Y座標
     */
    translate(dx: number, dy: number) {
        this.setPosition(this.x + dx, this.y + dy);
    }

    /**
     * 回転
     * @param angle ラジアン
     */
    addRotate(angle: number) {
        this.r = this.r + angle;
    }

    degToRad(d: number): number {
        return d * (Math.PI / 180);
    }

    /**
     * スクリーン座標X移動
     * @param x X座標
     */
    translateScreenX(x: number) {
        this.rebuildMatrix();
        let rad = this.degToRad(this.rotateScreen);
        this.x += x * Math.cos(-rad) * this.scaleScreenX;
        this.y += x * Math.sin(-rad) * this.scaleScreenY;
        this.isDirty = true;
    }

    /**
     * スクリーン座標Y移動
     * @param y Y座標
     */
    translateScreenY(y: number) {
        this.rebuildMatrix();
        let rad = this.degToRad(this.rotateScreen);
        this.x += - y * Math.cos(- (rad + Math.PI / 2)) * this.scaleScreenX;
        this.y += - y * Math.sin(- (rad + Math.PI / 2)) * this.scaleScreenY;
        this.isDirty = true;
    }

    /**
     * スクリーン座標X移動
     * @param x X座標
     * @param y y座標
     */
    translateScreen(x: number, y: number) {
        this.rebuildMatrix();
        let rad = this.degToRad(this.rotateScreen);
        this.x += x * Math.cos(-rad) - y * Math.cos(- (rad + Math.PI / 2)) * this.scaleScreenX;
        this.y += x * Math.sin(-rad) - y * Math.sin(- (rad + Math.PI / 2)) * this.scaleScreenY;
        this.isDirty = true;
    }

    /**
     * 画面に対しての頂点データ計算
     * @returns 頂点データ
     */
    computeVertexScreen(): VertexData {
        return new VertexData(this.vertices[Vertex.TYPE_LT].positionScreen,
            this.vertices[Vertex.TYPE_RT].positionScreen,
            this.vertices[Vertex.TYPE_RB].positionScreen,
            this.vertices[Vertex.TYPE_LB].positionScreen);
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

        const selfVs = this.computeVertexScreen();
        const oVecs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];

        const collides = new Array<Transform>();
        for (const otherT of Transform.nodeToIns.values()) {
            if (otherT != this) {
                const otherVs = otherT.computeVertexScreen();

                // 線分が交わっているか
                let isCollide = false;
                if (Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.a, otherVs.b)
                    || Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.b, otherVs.c)
                    || Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.c, otherVs.d)
                    || Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.d, otherVs.a)
                    || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.a, otherVs.b)
                    || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.b, otherVs.c)
                    || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.c, otherVs.d)
                    || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.d, otherVs.a)
                    || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.a, otherVs.b)
                    || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.b, otherVs.c)
                    || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.c, otherVs.d)
                    || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.d, otherVs.a)
                    || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.a, otherVs.b)
                    || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.b, otherVs.c)
                    || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.c, otherVs.d)
                    || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.d, otherVs.a)) {

                    isCollide = true;
                } else {
                    // 点が矩形内に入っているか
                    for (const oVec of oVecs) {
                        const otherVA = otherVs.a.addVectors(oVec);
                        const otherVB = otherVs.b.addVectors(oVec);
                        const otherVC = otherVs.c.addVectors(oVec);
                        const otherVD = otherVs.d.addVectors(oVec);

                        const crossAB = Vector2.cross(otherVA, otherVB);
                        const crossBC = Vector2.cross(otherVB, otherVC);
                        const crossCD = Vector2.cross(otherVC, otherVD);
                        const crossDA = Vector2.cross(otherVD, otherVA);
                        if (crossAB * crossBC > 0
                            && crossBC * crossCD > 0
                            && crossCD * crossDA > 0
                            && crossDA * crossAB > 0) {

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

    loopAtScreen(targetPos: Vector2) {
        const targetVec = targetPos.addVectors(this.vertices[Vertex.TYPE_ORIGIN].positionScreen.multiply(-1));
        const targetRad = Math.atan2(targetVec.y, targetVec.x);
        const baseVec = this.vertices[Vertex.TYPE_RIGHT].positionScreen.addVectors(this.vertices[Vertex.TYPE_ORIGIN].positionScreen.multiply(-1));
        const baseRad = Math.atan2(baseVec.y, baseVec.x);
        this.addRotate((targetRad - baseRad) / (Math.PI / 180));
    }

    /**
     * 更新された情報で変形反映
     */
    patch() {
        if (this.isDirty) {
            // this.node.setAttribute("style", `transform: ${this.matrix.toString()}`);
            var style = this.node.style;
            style.setProperty("--x", `${this.#x}px`);
            style.setProperty("--y", `${this.#y}px`);
            style.setProperty("--r", `${this.#r}deg`);
            style.setProperty("--sx", String(this.#sx));
            style.setProperty("--sy", String(this.#sy));
            style.setProperty("--w", `${this.#w}px`);
            style.setProperty("--h", `${this.#h}px`);
        }
        this.isDirty = false;
    }
}