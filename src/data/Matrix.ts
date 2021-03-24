
/**
 * 4x4行列
 */
export default class Matrix {

    /**
     * CSS Transform 文字列からパース
     * @param matrixString CSS Transform 文字列
     * @returns Matrix
     */
    static parse(matrixString: String): Matrix {
        let c = matrixString.split(/\s*[(),]\s*/).slice(1, -1);

        if (c.length === 6) {
            // 'matrix()' (3x2)
            return new Matrix(
                +c[0],
                +c[2],
                0,
                +c[4],
                +c[1],
                +c[3],
                0,
                +c[5],
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
            );
        } else if (c.length === 16) {
            // matrix3d() (4x4)
            return new Matrix(
                +c[0],
                +c[4],
                +c[8],
                +c[12],
                +c[1],
                +c[5],
                +c[9],
                +c[13],
                +c[2],
                +c[6],
                +c[10],
                +c[14],
                +c[3],
                +c[7],
                +c[11],
                +c[15],
            );
        } else {
            // handle 'none' or invalid values.
            return new Matrix(
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
            );
        }
    }

    /**
     * コンストラクタ
     * @param m11 c1r1
     * @param m21 c1r2
     * @param m31 c1r3
     * @param m41 c1r4
     * @param m12 c2r1
     * @param m22 c2r2
     * @param m32 c2r3
     * @param m42 c2r4
     * @param m13 c3r1
     * @param m23 c3r2
     * @param m33 c3r3
     * @param m43 c3r4
     * @param m14 c4r1
     * @param m24 c4r2
     * @param m34 c4r3
     * @param m44 c4r4
     */
    constructor(public m11: number,
        public m21: number,
        public m31: number,
        public m41: number,
        public m12: number,
        public m22: number,
        public m32: number,
        public m42: number,
        public m13: number,
        public m23: number,
        public m33: number,
        public m43: number,
        public m14: number,
        public m24: number,
        public m34: number,
        public m44: number
    ) { }
}