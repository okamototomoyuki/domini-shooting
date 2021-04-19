import MComponent from "../component/MComponent";
import Vector2 from "../data/Vector2";
import VertexData from "../data/VertexData";
import Engine from "../Engine";
import Constructable from "../interface/Constructable";
import MathUtils from "../util/MathUtils";
import MVertex from "./MVertex";

/**
 * 矩形の Transform
 */
export default class MEntity extends HTMLElement {

    static list = new Array<MEntity>();

    static generate(): MEntity {
        const node = document.createElement('m-entity') as MEntity
        document.body.appendChild(node);
        node.initializeIfNotYet();
        return node;
    }

    static update() {
        // 衝突判定計算
        for (const e of this.list) {
            e.collides = [];
            e.notCollides = [];
        }
        for (const e of this.list) {
            e.calcCollides();
        }

        // 更新
        for (const e of this.list) {
            if (e.isDestroy == false) {
                e.update();
            } else {
                e.onDestroy();
            }
        }
    }

    vertices: MVertex[] = [];
    nameToComponent = new Map<string, MComponent>();
    collides: Array<MEntity> = [];
    notCollides: Array<MEntity> = [];


    connectedCallback() {
        this.initializeIfNotYet();
    }

    initializeIfNotYet() {
        if (MEntity.list.includes(this) == false) {
            MEntity.list.push(this);
            this.vertices = [
                MVertex.new(this, MVertex.TYPE_LT),
                MVertex.new(this, MVertex.TYPE_RT),
                MVertex.new(this, MVertex.TYPE_RB),
                MVertex.new(this, MVertex.TYPE_LB),
            ];

            const style = this.style;
            const computeStyle = getComputedStyle(this, null);
            if (style.getPropertyValue("--x") == "") {
                this.x = 0;
            }
            if (style.getPropertyValue("--y") == "") {
                this.y = 0;
            }
            if (style.getPropertyValue("--rad") == "") {
                this.rad = 0;
            }
            if (style.getPropertyValue("--sx") == "") {
                this.sx = 1;
            }
            if (style.getPropertyValue("--sy") == "") {
                this.sy = 1;
            }

            const w = style.getPropertyValue("--w").replace("px", "");
            this.w = w ? Number(w) : Number(computeStyle.width.replace("px", ""));
            const h = style.getPropertyValue("--h").replace("px", "");
            this.h = h ? Number(h) : Number(computeStyle.height.replace("px", ""));
        }

    }

    update() {
        const nameToComp = new Map(this.nameToComponent);
        const attrs = [...this.attributes];

        // 存在チェック
        for (const attr of attrs) {
            let comp = nameToComp.get(attr.name);
            if (comp) {
                nameToComp.delete(attr.name)
            } else {
                // なければ追加
                const compClass = MComponent.getClass(attr.name);
                if (compClass) {
                    comp = this.addComponent(compClass);
                    if (comp) {
                        comp.entity = this;
                        this.nameToComponent.set(attr.name, comp);
                    }
                }
            }

            // 更新
            if (comp) {
                if (comp.isStart == false) {
                    comp.start();
                    comp.isStart = true;
                }
                comp.update();
            }
        }
        // 削除されたら Destroy 
        for (const comp of nameToComp.values()) {
            comp.onDestroy();
        }
    }

    onDestroy() {
        // コンポーネント全破棄 
        for (const comp of this.nameToComponent.values()) {
            comp.onDestroy();
        }
    }

    get x(): number {
        const x = this.style.getPropertyValue("--x");
        return x ? Number(x.replace("px", "")) : 0;
    }
    set x(x: number) {
        this.style.setProperty("--x", `${x}px`);
    }
    get y(): number {
        const y = this.style.getPropertyValue("--y");
        return y ? Number(y.replace("px", "")) : 0;
    }
    set y(y: number) {
        this.style.setProperty("--y", `${y}px`);
    }
    get rad(): number {
        const r = this.style.getPropertyValue("--rad");
        return r ? Number(r.replace("rad", "")) : 0;
    }
    set rad(r: number) {
        this.style.setProperty("--rad", `${r}rad`);
    }
    get sx(): number {
        const sx = this.style.getPropertyValue("--sx");
        return sx ? Number(sx) : 1;
    }
    set sx(sx: number) {
        this.style.setProperty("--sx", `${sx}`);
    }
    get sy(): number {
        const sy = this.style.getPropertyValue("--sy");
        return sy ? Number(sy) : 1;
    }
    set sy(sy: number) {
        this.style.setProperty("--sy", `${sy}`);
    }
    get w(): number {
        const w = this.style.getPropertyValue("--w");
        return w ? Number(w.replace("px", "")) : 1;
    }
    set w(w: number) {
        this.style.setProperty("--w", `${w}px`);
    }
    get h(): number {
        const h = this.style.getPropertyValue("--h");
        return h ? Number(h.replace("px", "")) : 1;
    }
    set h(h: number) {
        this.style.setProperty("--h", `${h}px`);
    }
    get bg(): string {
        const bg = this.style.getPropertyValue("--bg");
        return bg ? bg : "black";
    }
    set bg(bg: string) {
        this.style.setProperty("--bg", bg);
    }

    get position(): Vector2 {
        return new Vector2(this.x, this.y);
    }
    set position(v: Vector2) {
        this.x = v.x;
        this.y = v.y;
    }
    get scale(): Vector2 {
        return new Vector2(this.sx, this.sy);
    }
    set scale(v: Vector2) {
        this.sx = v.x;
        this.sy = v.y;
    }
    get parentRad(): number {
        return this.radianScreen - this.rad;
    }
    get parentSx(): number {
        return this.scaleScreenX / this.sx;
    }
    get parentSy(): number {
        return this.scaleScreenY / this.sy;
    }

    get origin(): Vector2 {
        return this.vertices[MVertex.TYPE_LT].positionScreen.addVectors(this.vertices[MVertex.TYPE_RB].positionScreen).multiply(0.5);
    }
    get top(): Vector2 {
        return this.vertices[MVertex.TYPE_LT].positionScreen.addVectors(this.vertices[MVertex.TYPE_RT].positionScreen).multiply(0.5);
    }
    get bottom(): Vector2 {
        return this.vertices[MVertex.TYPE_LB].positionScreen.addVectors(this.vertices[MVertex.TYPE_RB].positionScreen).multiply(0.5);
    }
    get left(): Vector2 {
        return this.vertices[MVertex.TYPE_LT].positionScreen.addVectors(this.vertices[MVertex.TYPE_LB].positionScreen).multiply(0.5);
    }
    get right(): Vector2 {
        return this.vertices[MVertex.TYPE_RT].positionScreen.addVectors(this.vertices[MVertex.TYPE_RB].positionScreen).multiply(0.5);
    }

    get positionScreen(): Vector2 {
        return this.origin;
    }
    set positionScreen(screenPos: Vector2) {
        let toVector = screenPos.addVectors(this.positionScreen.multiply(-1));
        this.translateScreen(toVector.x, toVector.y);
    }
    get radianScreen(): number {
        const vec = this.right.addVectors(this.origin.multiply(-1));
        return Math.atan2(vec.y, vec.x);
    }

    get degreeScreen(): number {
        return MathUtils.radToDeg(this.radianScreen);
    }

    get scaleScreenX(): number {
        const vec = this.right.addVectors(this.left.multiply(-1));
        return vec.distance / this.offsetWidth;
    }

    get scaleScreenY(): number {
        const vec = this.bottom.addVectors(this.top.multiply(-1));
        return vec.distance / this.offsetHeight;
    }

    /**
     * スクリーン座標X移動
     * @param x X座標
     */
    translateScreenX(x: number) {
        const parentRad = this.parentRad;
        this.x += x * Math.cos(-parentRad) * this.parentSx;
        this.y += x * Math.sin(-parentRad) * this.parentSy;
    }

    /**
     * スクリーン座標Y移動
     * @param y Y座標
     */
    translateScreenY(y: number) {
        const parentRad = this.parentRad;
        this.x += - y * Math.cos(- (parentRad + Math.PI / 2)) * this.parentSx;
        this.y += - y * Math.sin(- (parentRad + Math.PI / 2)) * this.parentSy;
    }

    /**
     * スクリーン座標X移動
     * @param x X座標
     * @param y y座標
     */
    translateScreen(x: number, y: number) {
        const parentRad = this.parentRad;
        this.x += (x * Math.cos(-parentRad) - y * Math.cos(- (parentRad + Math.PI / 2))) * this.parentSx;
        this.y += (x * Math.sin(-parentRad) - y * Math.sin(- (parentRad + Math.PI / 2))) * this.parentSx;
    }

    /**
     * 画面に対しての頂点データ計算
     * @returns 頂点データ
     */
    computeVertexScreen(): VertexData {
        return new VertexData(this.vertices[MVertex.TYPE_LT].positionScreen,
            this.vertices[MVertex.TYPE_RT].positionScreen,
            this.vertices[MVertex.TYPE_RB].positionScreen,
            this.vertices[MVertex.TYPE_LB].positionScreen);
    };

    get radius(): number {
        ここと
        // return Math.sqrt(Math.pow(this.w / 2, 2) + Math.pow(this.h / 2, 2))
    }

    /**
     * 親ノード取得
     */
    get parentNode(): HTMLElement {
        return this.parentNode as HTMLElement;
    }

    /**
     * 衝突した対象一覧
     */
    calcCollides() {

        const selfVs = this.computeVertexScreen();
        const subSVs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];

        for (const otherT of MEntity.list) {
            if (otherT != this && this.collides.includes(otherT) == false && this.notCollides.includes(otherT) == false) {
                const otherVs = otherT.computeVertexScreen();
                const subOVs = [otherVs.a.multiply(-1), otherVs.b.multiply(-1), otherVs.c.multiply(-1), otherVs.d.multiply(-1)];

                // 距離が接触範囲内か
                ここに距離が近いかを追加

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
                }

                if (isCollide == false) {
                    // 自身が相手の矩形内に入っているか
                    for (const subSV of subSVs) {
                        const otherVA = otherVs.a.addVectors(subSV);
                        const otherVB = otherVs.b.addVectors(subSV);
                        const otherVC = otherVs.c.addVectors(subSV);
                        const otherVD = otherVs.d.addVectors(subSV);

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

                if (isCollide == false) {

                    // 相手が自身の矩形内に入っているか
                    for (const subOV of subOVs) {
                        const selfVA = selfVs.a.addVectors(subOV);
                        const selfVB = selfVs.b.addVectors(subOV);
                        const selfVC = selfVs.c.addVectors(subOV);
                        const selfVD = selfVs.d.addVectors(subOV);

                        const crossAB = Vector2.cross(selfVA, selfVB);
                        const crossBC = Vector2.cross(selfVB, selfVC);
                        const crossCD = Vector2.cross(selfVC, selfVD);
                        const crossDA = Vector2.cross(selfVD, selfVA);

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
                    this.collides.push(otherT);
                    otherT.collides.push(this);
                } else {
                    this.notCollides.push(otherT);
                    otherT.notCollides.push(this);
                }
            }
        }
    }

    loopAtScreen(targetPos: Vector2) {
        const targetVec = targetPos.addVectors(this.origin.multiply(-1));
        const targetRad = Math.atan2(targetVec.y, targetVec.x);
        const baseVec = this.right.addVectors(this.origin.multiply(-1));
        const baseRad = Math.atan2(baseVec.y, baseVec.x);
        this.rad += targetRad - baseRad;
    }

    addComponent(compClass: Constructable<MComponent>): MComponent | undefined {
        const attrName = MComponent.getAttributeName(compClass);
        if (attrName) {
            let comp = new compClass();
            if (comp) {
                comp.entity = this;
                this.nameToComponent.set(attrName, comp);

                // DOM に書かれてなければ追加
                if (this.attributes.getNamedItem(attrName) == null) {
                    this.setAttribute(attrName, "")
                }
            }
            return comp;
        }
        return undefined;
    }

    get isInBody(): boolean {
        const rect = document.body.getBoundingClientRect();
        const pos = this.positionScreen
        return 0 < pos.x && pos.x < rect.width && 0 < pos.y && pos.y < rect.height;
    }

    get isDestroy(): boolean {
        return this.parentElement == null;
    }
}
customElements.define("m-entity", MEntity);