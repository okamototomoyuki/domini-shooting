import type Vector2 from "./Vector2";

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
    constructor(public a: Vector2, public b: Vector2, public c: Vector2, public d: Vector2) { }

    get vertices(): Array<Vector2> {
        return [this.a, this.b, this.c, this.d];
    }
}
