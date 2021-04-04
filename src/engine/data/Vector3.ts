/**
 * XYZベクトル
 */
export default class Vector3 {

    /**
     * コンストラクタ
     * @param x X
     * @param y Y
     * @param z Z
     */
    constructor(public x: number, public y: number, public z: number) { }

    /**
     * 移動
     * @param v 移動ベクトル
     * @returns 結果のベクトル
     */
    addVectors(v: Vector3): Vector3 {
        return new Vector3(
            this.x + v.x,
            this.y + v.y,
            this.z + v.z,
        );
    }

    /**
     * 掛け算
     * @param v 係数
     * @returns 結果のベクトル
     */
    multiply(v: number): Vector3 {
        return new Vector3(
            this.x * v,
            this.y * v,
            this.z * v,
        );
    }

    /**
     * 回転
     * @param v 回転ベクトル
     * @returns 結果のベクトル
     */
    rotateVector(v: Vector3): Vector3 {
        let x1 = this.x;
        let y1 = this.y;
        let z1 = this.z;
        let angleX = v.x / 2;
        let angleY = v.y / 2;
        let angleZ = v.z / 2;
        let cr = Math.cos(angleX);
        let cp = Math.cos(angleY);
        let cy = Math.cos(angleZ);
        let sr = Math.sin(angleX);
        let sp = Math.sin(angleY);
        let sy = Math.sin(angleZ);
        let w = cr * cp * cy + -sr * sp * -sy;
        let x = sr * cp * cy - -cr * sp * -sy;
        let y = cr * sp * cy + sr * cp * sy;
        let z = cr * cp * sy - -sr * sp * -cy;
        let m0 = 1 - 2 * (y * y + z * z);
        let m1 = 2 * (x * y + z * w);
        let m2 = 2 * (x * z - y * w);
        let m4 = 2 * (x * y - z * w);
        let m5 = 1 - 2 * (x * x + z * z);
        let m6 = 2 * (z * y + x * w);
        let m8 = 2 * (x * z + y * w);
        let m9 = 2 * (y * z - x * w);
        let m10 = 1 - 2 * (x * x + y * y);

        return new Vector3(
            x1 * m0 + y1 * m4 + z1 * m8,
            x1 * m1 + y1 * m5 + z1 * m9,
            x1 * m2 + y1 * m6 + z1 * m10,
        );
    }

    /**
     * 外積
     * @param va ベクトルa
     * @param vb ベクトルb
     * @returns 外積のベクトル
     */
    static cross(va: Vector3, vb: Vector3): Vector3 {
        return new Vector3(va.y * vb.z - va.z * vb.y, va.z * vb.x - va.x * vb.z, va.x * vb.y - va.y * vb.x)
    }

    /**
     * XY座標線分が交わっているか
     * @param aFrom 線分A始点
     * @param aTo 線分A終点
     * @param bFrom 線分B始点
     * @param bTo 線分B終点
     * @returns true:交わっている
     */
    static isCrossXY(aFrom: Vector3, aTo: Vector3, bFrom: Vector3, bTo: Vector3,): Boolean {
        const ta = (bFrom.x - bTo.x) * (aFrom.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aFrom.x);
        const tb = (bFrom.x - bTo.x) * (aTo.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aTo.x);
        const tc = (aFrom.x - aTo.x) * (bFrom.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bFrom.x);
        const td = (aFrom.x - aTo.x) * (bTo.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bTo.x);
        return tc * td < 0 && ta * tb < 0;
    }
}