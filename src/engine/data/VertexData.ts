import type Vector3 from "./Vector3";

/*
* 矩形の頂点データ
*/
export default class VertexData extends Array<Vector3> {

    /**
     * コンストラクタ
     * @param a 点1 左上
     * @param b 点2 右上
     * @param c 点3 右下
     * @param d 点4 左下
     */
    constructor(a: Vector3, b: Vector3, c: Vector3, d: Vector3) {
        super();
        this[0] = a;
        this[1] = b;
        this[2] = c;
        this[3] = d;
    }

    get a(): Vector3 {
        return this[0]
    }
    get b(): Vector3 {
        return this[1]
    }
    get c(): Vector3 {
        return this[2]
    }
    get d(): Vector3 {
        return this[3]
    }

    set a(v: Vector3) {
        this[0] = v;
    }
    set b(v: Vector3) {
        this[1] = v;
    }
    set c(v: Vector3) {
        this[2] = v;
    }
    set d(v: Vector3) {
        this[3] = v;
    }
}
