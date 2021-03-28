import Vector3 from "./Vector3";

/**
 * 4x4行列
 */
export default class Matrix extends Array<number> {

    static format(source: number[]): Matrix {
        if (source && source.constructor === Array) {
            const values = source
                .filter(function (value) { return typeof value === 'number'; })
                .filter(function (value) { return !isNaN(value); });

            if (source.length === 6 && values.length === 6) {
                const matrix = this.identity();
                matrix[0] = values[0];
                matrix[1] = values[1];
                matrix[4] = values[2];
                matrix[5] = values[3];
                matrix[12] = values[4];
                matrix[13] = values[5];
                return matrix;
            } else if (source.length === 16 && values.length === 16) {
                return this.fromArray(values);
            }
        }
        throw new TypeError('Expected a `number[]` with length 6 or 16.')
    }

    static fromArray(array) {
        const m = new Matrix();
        array && Object.assign(m, array);
        return m;
    }

    static fromString(source: string): Matrix {
        if (typeof source === 'string') {
            var match = source.match(/matrix(3d)?\(([^)]+)\)/);
            if (match) {
                var raw = match[2].split(',').map(parseFloat);
                return this.format(raw)
            }
            if (source === 'none' || source === '') {
                return this.identity();
            }
        }
        throw new TypeError('Expected a string containing `matrix()` or `matrix3d()')
    }

    static identity(): Matrix {
        const matrix = [];
        for (var i = 0; i < 16; i++) {
            i % 5 == 0 ? matrix.push(1) : matrix.push(0);
        }
        return Matrix.format(matrix);
    }

    get m00() { return this[0]; }
    get m01() { return this[1]; }
    get m02() { return this[2]; }
    get m03() { return this[3]; }
    get m10() { return this[4]; }
    get m11() { return this[5]; }
    get m12() { return this[6]; }
    get m13() { return this[7]; }
    get m20() { return this[8]; }
    get m21() { return this[9]; }
    get m22() { return this[10]; }
    get m23() { return this[11]; }
    get m30() { return this[12]; }
    get m31() { return this[13]; }
    get m32() { return this[14]; }
    get m33() { return this[15]; }

    inverse(): Matrix {
        const m = this;

        const s0 = m[0] * m[5] - m[4] * m[1];
        const s1 = m[0] * m[6] - m[4] * m[2];
        const s2 = m[0] * m[7] - m[4] * m[3];
        const s3 = m[1] * m[6] - m[5] * m[2];
        const s4 = m[1] * m[7] - m[5] * m[3];
        const s5 = m[2] * m[7] - m[6] * m[3];

        const c5 = m[10] * m[15] - m[14] * m[11];
        const c4 = m[9] * m[15] - m[13] * m[11];
        const c3 = m[9] * m[14] - m[13] * m[10];
        const c2 = m[8] * m[15] - m[12] * m[11];
        const c1 = m[8] * m[14] - m[12] * m[10];
        const c0 = m[8] * m[13] - m[12] * m[9];

        const determinant = 1 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

        if (isNaN(determinant) || determinant === Infinity) {
            throw new Error('Inverse determinant attempted to divide by zero.')
        }

        return Matrix.format([
            (m[5] * c5 - m[6] * c4 + m[7] * c3) * determinant,
            (-m[1] * c5 + m[2] * c4 - m[3] * c3) * determinant,
            (m[13] * s5 - m[14] * s4 + m[15] * s3) * determinant,
            (-m[9] * s5 + m[10] * s4 - m[11] * s3) * determinant,

            (-m[4] * c5 + m[6] * c2 - m[7] * c1) * determinant,
            (m[0] * c5 - m[2] * c2 + m[3] * c1) * determinant,
            (-m[12] * s5 + m[14] * s2 - m[15] * s1) * determinant,
            (m[8] * s5 - m[10] * s2 + m[11] * s1) * determinant,

            (m[4] * c4 - m[5] * c2 + m[7] * c0) * determinant,
            (-m[0] * c4 + m[1] * c2 - m[3] * c0) * determinant,
            (m[12] * s4 - m[13] * s2 + m[15] * s0) * determinant,
            (-m[8] * s4 + m[9] * s2 - m[11] * s0) * determinant,

            (-m[4] * c3 + m[5] * c1 - m[6] * c0) * determinant,
            (m[0] * c3 - m[1] * c1 + m[2] * c0) * determinant,
            (-m[12] * s3 + m[13] * s1 - m[14] * s0) * determinant,
            (m[8] * s3 - m[9] * s1 + m[10] * s0) * determinant]);
    }

    static multiply(fma: Matrix, fmb: Matrix): Matrix {
        // var fma = format(matrixA);
        // var fmb = format(matrixB);
        const product = new Matrix();

        for (let i = 0; i < 4; i++) {
            const row = [fma[i], fma[i + 4], fma[i + 8], fma[i + 12]];
            for (let j = 0; j < 4; j++) {
                const k = j * 4;
                const col = [fmb[k], fmb[k + 1], fmb[k + 2], fmb[k + 3]];
                const result = row[0] * col[0] + row[1] * col[1] + row[2] * col[2] + row[3] * col[3];

                product[i + k] = result;
            }
        }

        return product;
    }

    perspective(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix[11] = -1 / distance;
        return Matrix.multiply(this, matrix);
    }

    getRotate(): Vector3 {
        let rotateY = Math.asin(-this.m02);
        let rotateX = Math.atan2(this.m12, this.m22)
        let rotateZ = Math.atan2(this.m01, this.m00)
        return new Vector3(rotateX, rotateY, rotateZ);
    }

    rotate(angle: number): Matrix {
        return this.rotateZ(angle)
    }

    rotateX(angle: number): Matrix {
        const theta = (Math.PI / 180) * angle;
        const matrix = Matrix.identity();

        matrix[5] = matrix[10] = Math.cos(theta);
        matrix[6] = matrix[9] = Math.sin(theta);
        matrix[9] *= -1;

        return Matrix.multiply(this, matrix);
    }

    rotateY(angle: number): Matrix {
        const theta = (Math.PI / 180) * angle;
        const matrix = Matrix.identity();

        matrix[0] = matrix[10] = Math.cos(theta);
        matrix[2] = matrix[8] = Math.sin(theta);
        matrix[2] *= -1;

        return Matrix.multiply(this, matrix);
    }

    rotateZ(angle: number): Matrix {
        const theta = (Math.PI / 180) * angle;
        const matrix = Matrix.identity();

        matrix[0] = matrix[5] = Math.cos(theta);
        matrix[1] = matrix[4] = Math.sin(theta);
        matrix[4] *= -1;

        return Matrix.multiply(this, matrix);
    }

    getScale(): Vector3 {
        let x = Math.sqrt(Math.pow(this.m00, 2) + Math.pow(this.m10, 2) + Math.pow(this.m20, 2));
        let y = Math.sqrt(Math.pow(this.m01, 2) + Math.pow(this.m11, 2) + Math.pow(this.m21, 2));
        let z = Math.sqrt(Math.pow(this.m02, 2) + Math.pow(this.m12, 2) + Math.pow(this.m22, 2));
        return new Vector3(x, y, z);
    }

    scale(scalar: number, scalarY: number = undefined): Matrix {
        const matrix = Matrix.identity();

        matrix[0] = scalar;
        matrix[5] = typeof scalarY === 'number' ? scalarY : scalar;

        return Matrix.multiply(this, matrix);
    }

    scaleX(scalar: number): Matrix {
        const matrix = Matrix.identity();
        matrix[0] = scalar;
        return Matrix.multiply(this, matrix);
    }

    scaleY(scalar: number): Matrix {
        const matrix = Matrix.identity();
        matrix[5] = scalar;
        return Matrix.multiply(this, matrix);

    }

    scaleZ(scalar: number): Matrix {
        const matrix = Matrix.identity();
        matrix[10] = scalar;
        return Matrix.multiply(this, matrix);
    }

    getTranslate(): Vector3 {
        return new Vector3(this.m30, this.m31, this.m32);
    }

    translate(distanceX: number, distanceY: number): Matrix {
        const matrix = Matrix.identity();
        matrix[12] = distanceX;

        if (distanceY) {
            matrix[13] = distanceY;
        }

        return Matrix.multiply(this, matrix);
    }

    translate3d(distanceX: number, distanceY: number, distanceZ: number): Matrix {
        const matrix = Matrix.identity();
        if (distanceX !== undefined && distanceY !== undefined && distanceZ !== undefined) {
            matrix[12] = distanceX;
            matrix[13] = distanceY;
            matrix[14] = distanceZ;
        }
        return Matrix.multiply(this, matrix);
    }

    translateX(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix[12] = distance;
        return Matrix.multiply(this, matrix);
    }

    translateY(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix[13] = distance;
        return Matrix.multiply(this, matrix);
    }

    translateZ(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix[14] = distance;
        return Matrix.multiply(this, matrix);
    }

    toString() {
        return ("matrix3d(" + (this.join(', ')) + ")")
    }
}