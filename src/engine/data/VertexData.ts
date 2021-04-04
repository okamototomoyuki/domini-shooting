import type Vector3 from "./Vector3";

/*
* 矩形の頂点データ
*/
export default class VertexData {

    /**
     * コンストラクタ
     * @param a 点1 左上
     * @param b 点2 右上
     * @param c 点3 右下
     * @param d 点4 左下
     */
    constructor(public a: Vector3, public b: Vector3, public c: Vector3, public d: Vector3) { }

    get vertices(): Array<Vector3> {
        return [this.a, this.b, this.c, this.d];
    }
}
