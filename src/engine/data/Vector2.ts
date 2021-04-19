/**
 * XYベクトル
 */
export default class Vector2 {

    /**
     * コンストラクタ
     * @param x X
     * @param y Y
     */
    constructor(public x: number, public y: number) { }

    /**
     * 移動
     * @param v 移動ベクトル
     * @returns 結果のベクトル
     */
    addVectors(v: Vector2): Vector2 {
        return new Vector2(
            this.x + v.x,
            this.y + v.y,
        );
    }

    /**
     * 掛け算
     * @param v 係数
     * @returns 結果のベクトル
     */
    multiply(v: number): Vector2 {
        return new Vector2(
            this.x * v,
            this.y * v,
        );
    }

    /**
     * 掛け算
     * @param v 係数
     * @returns 結果のベクトル
     */
    get normalized(): Vector2 {
        return this.multiply(1 / this.distance);
    }

    /**
     * 長さ
     * @returns 長さ
     */
    get distance(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    /**
     * 2点の距離
     * @param pos 相手の位置
     * @returns 長さ
     */
    getDistance(pos: Vector2): number {
        return Math.sqrt(Math.pow(this.x - pos.x, 2) + Math.pow(this.y - pos.y, 2));
    }

    /**
     * 外積
     * @param va ベクトルa
     * @param vb ベクトルb
     * @returns 外積のベクトル
     */
    static cross(va: Vector2, vb: Vector2): number {
        return va.x * vb.y - va.y * vb.x
    }

    /**
     * XY座標線分が交わっているか
     * @param aFrom 線分A始点
     * @param aTo 線分A終点
     * @param bFrom 線分B始点
     * @param bTo 線分B終点
     * @returns true:交わっている
     */
    static isCrossXY(aFrom: Vector2, aTo: Vector2, bFrom: Vector2, bTo: Vector2,): Boolean {
        const ta = (bFrom.x - bTo.x) * (aFrom.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aFrom.x);
        const tb = (bFrom.x - bTo.x) * (aTo.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aTo.x);
        const tc = (aFrom.x - aTo.x) * (bFrom.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bFrom.x);
        const td = (aFrom.x - aTo.x) * (bTo.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bTo.x);
        return tc * td < 0 && ta * tb < 0;
    }
}