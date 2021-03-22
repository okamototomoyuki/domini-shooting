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
     * 回転
     * @param v 回転ベクトル
     * @returns 結果のベクトル
     */
    rotateVector(v: Vector3): Vector3 {
        var x1 = this.x,
            y1 = this.y,
            z1 = this.z,
            angleX = v.x / 2,
            angleY = v.y / 2,
            angleZ = v.z / 2,
            cr = Math.cos(angleX),
            cp = Math.cos(angleY),
            cy = Math.cos(angleZ),
            sr = Math.sin(angleX),
            sp = Math.sin(angleY),
            sy = Math.sin(angleZ),
            w = cr * cp * cy + -sr * sp * -sy,
            x = sr * cp * cy - -cr * sp * -sy,
            y = cr * sp * cy + sr * cp * sy,
            z = cr * cp * sy - -sr * sp * -cy,
            m0 = 1 - 2 * (y * y + z * z),
            m1 = 2 * (x * y + z * w),
            m2 = 2 * (x * z - y * w),
            m4 = 2 * (x * y - z * w),
            m5 = 1 - 2 * (x * x + z * z),
            m6 = 2 * (z * y + x * w),
            m8 = 2 * (x * z + y * w),
            m9 = 2 * (y * z - x * w),
            m10 = 1 - 2 * (x * x + y * y);

        return new Vector3(
            x1 * m0 + y1 * m4 + z1 * m8,
            x1 * m1 + y1 * m5 + z1 * m9,
            x1 * m2 + y1 * m6 + z1 * m10,
        );
    }