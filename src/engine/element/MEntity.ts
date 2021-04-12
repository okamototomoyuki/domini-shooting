import Vector2 from "../data/Vector2";
import VertexData from "../data/VertexData";
import MVertex from "./MVertex";

/**
 * 矩形の Transform
 */
export default class MEntity extends HTMLElement {

    static list = new Array<MEntity>();

    isInit = false;
    vertices: MVertex[] = [];

    connectedCallback() {
        if (this.isInit == false) {
            this.isInit = true;
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
            if (style.getPropertyValue("--r") == "") {
                this.r = 0;
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

            MEntity.list.push(this);
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
    get r(): number {
        const r = this.style.getPropertyValue("--r");
        return r ? Number(r.replace("deg", "")) : 0;
    }
    set r(r: number) {
        this.style.setProperty("--r", `${r}deg`);
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

    get origin(): Vector2 {
        return this.vertices[MVertex.TYPE_LT].positionScreen.addVectors(this.vertices[MVertex.TYPE_LT].positionScreen).multiply(0.5);
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

    get rotateScreen(): number {
        const vec = this.right.addVectors(this.origin.multiply(-1));
        return Math.atan2(vec.y, vec.x);
    }

    get scaleScreenX(): number {
        const vec = this.right.addVectors(this.left.multiply(-1));
        return vec.distance / this.offsetWidth;
    }

    get scaleScreenY(): number {
        const vec = this.bottom.addVectors(this.top.multiply(-1));
        return vec.distance / this.offsetHeight;
    }

    degToRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    radToDeg(rad: number): number {
        return rad / (Math.PI / 180);
    }

    /**
     * スクリーン座標X移動
     * @param x X座標
     */
    translateScreenX(x: number) {
        let rad = this.degToRad(this.rotateScreen);
        this.x += x * Math.cos(-rad) * this.scaleScreenX;
        this.y += x * Math.sin(-rad) * this.scaleScreenY;
    }

    /**
     * スクリーン座標Y移動
     * @param y Y座標
     */
    translateScreenY(y: number) {
        let rad = this.degToRad(this.rotateScreen);
        this.x += - y * Math.cos(- (rad + Math.PI / 2)) * this.scaleScreenX;
        this.y += - y * Math.sin(- (rad + Math.PI / 2)) * this.scaleScreenY;
    }

    /**
     * スクリーン座標X移動
     * @param x X座標
     * @param y y座標
     */
    translateScreen(x: number, y: number) {
        let rad = this.degToRad(this.rotateScreen);
        this.x += x * Math.cos(-rad) - y * Math.cos(- (rad + Math.PI / 2)) * this.scaleScreenX;
        this.y += x * Math.sin(-rad) - y * Math.sin(- (rad + Math.PI / 2)) * this.scaleScreenY;
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

    /**
     * 親ノード取得
     */
    get parentNode(): HTMLElement {
        return this.parentNode as HTMLElement;
    }

    /**
     * 衝突した対象一覧
     */
    get collides(): MEntity[] {

        const selfVs = this.computeVertexScreen();
        const subSVs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];

        const collides = new Array<MEntity>();
        for (const otherT of MEntity.list) {
            if (otherT != this) {
                const otherVs = otherT.computeVertexScreen();
                const subOVs = [otherVs.a.multiply(-1), otherVs.b.multiply(-1), otherVs.c.multiply(-1), otherVs.d.multiply(-1)];

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
                    collides.push(otherT);
                }
            }
        }
        return collides;
    }

    loopAtScreen(targetPos: Vector2) {
        const targetVec = targetPos.addVectors(this.origin.multiply(-1));
        const targetRad = Math.atan2(targetVec.y, targetVec.x);
        const baseVec = this.right.addVectors(this.origin.multiply(-1));
        const baseRad = Math.atan2(baseVec.y, baseVec.x);
        this.r += this.radToDeg(targetRad - baseRad);
    }
}
customElements.define("m-entity", MEntity);