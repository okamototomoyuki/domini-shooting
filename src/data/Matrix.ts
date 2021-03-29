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
                matrix.r0c0 = values[0];
                matrix.r0c1 = values[1];
                matrix.r1c0 = values[2];
                matrix.r1c1 = values[3];
                matrix.r3c0 = values[4];
                matrix.r3c1 = values[5];
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

    get r0c0(): number { return this[0]; }
    get r0c1(): number { return this[1]; }
    get r0c2(): number { return this[2]; }
    get r0c3(): number { return this[3]; }
    get r1c0(): number { return this[4]; }
    get r1c1(): number { return this[5]; }
    get r1c2(): number { return this[6]; }
    get r1c3(): number { return this[7]; }
    get r2c0(): number { return this[8]; }
    get r2c1(): number { return this[9]; }
    get r2c2(): number { return this[10]; }
    get r2c3(): number { return this[11]; }
    get r3c0(): number { return this[12]; }
    get r3c1(): number { return this[13]; }
    get r3c2(): number { return this[14]; }
    get r3c3(): number { return this[15]; }

    set r0c0(v: number) { this[0] = v; }
    set r0c1(v: number) { this[1] = v; }
    set r0c2(v: number) { this[2] = v; }
    set r0c3(v: number) { this[3] = v; }
    set r1c0(v: number) { this[4] = v; }
    set r1c1(v: number) { this[5] = v; }
    set r1c2(v: number) { this[6] = v; }
    set r1c3(v: number) { this[7] = v; }
    set r2c0(v: number) { this[8] = v; }
    set r2c1(v: number) { this[9] = v; }
    set r2c2(v: number) { this[10] = v; }
    set r2c3(v: number) { this[11] = v; }
    set r3c0(v: number) { this[12] = v; }
    set r3c1(v: number) { this[13] = v; }
    set r3c2(v: number) { this[14] = v; }
    set r3c3(v: number) { this[15] = v; }

    inverse(): Matrix {
        const m = this;

        const s0 = m.r0c0 * m.r1c1 - m.r1c0 * m.r0c1;
        const s1 = m.r0c0 * m.r1c2 - m.r1c0 * m.r0c2;
        const s2 = m.r0c0 * m.r1c3 - m.r1c0 * m.r0c3;
        const s3 = m.r0c1 * m.r1c2 - m.r1c1 * m.r0c2;
        const s4 = m.r0c1 * m.r1c3 - m.r1c1 * m.r0c3;
        const s5 = m.r0c2 * m.r1c3 - m.r1c2 * m.r0c3;

        const c5 = m.r2c2 * m.r3c3 - m.r3c2 * m.r2c3;
        const c4 = m.r2c1 * m.r3c3 - m.r3c1 * m.r2c3;
        const c3 = m.r2c1 * m.r3c2 - m.r3c1 * m.r2c2;
        const c2 = m.r2c0 * m.r3c3 - m.r3c0 * m.r2c3;
        const c1 = m.r2c0 * m.r3c2 - m.r3c0 * m.r2c2;
        const c0 = m.r2c0 * m.r3c1 - m.r3c0 * m.r2c1;

        const determinant = 1 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

        if (isNaN(determinant) || determinant === Infinity) {
            throw new Error('Inverse determinant attempted to divide by zero.')
        }

        return Matrix.format([
            (m.r1c1 * c5 - m.r1c2 * c4 + m.r1c3 * c3) * determinant,
            (-m.r0c1 * c5 + m.r0c2 * c4 - m.r0c3 * c3) * determinant,
            (m.r3c1 * s5 - m.r3c2 * s4 + m.r3c3 * s3) * determinant,
            (-m.r2c1 * s5 + m.r2c2 * s4 - m.r2c3 * s3) * determinant,

            (-m.r1c0 * c5 + m.r1c2 * c2 - m.r1c3 * c1) * determinant,
            (m.r0c0 * c5 - m.r0c2 * c2 + m.r0c3 * c1) * determinant,
            (-m.r3c0 * s5 + m.r3c2 * s2 - m.r3c3 * s1) * determinant,
            (m.r2c0 * s5 - m.r2c2 * s2 + m.r2c3 * s1) * determinant,

            (m.r1c0 * c4 - m.r1c1 * c2 + m.r1c3 * c0) * determinant,
            (-m.r0c0 * c4 + m.r0c1 * c2 - m.r0c3 * c0) * determinant,
            (m.r3c0 * s4 - m.r3c1 * s2 + m.r3c3 * s0) * determinant,
            (-m.r2c0 * s4 + m.r2c1 * s2 - m.r2c3 * s0) * determinant,

            (-m.r1c0 * c3 + m.r1c1 * c1 - m.r1c2 * c0) * determinant,
            (m.r0c0 * c3 - m.r0c1 * c1 + m.r0c2 * c0) * determinant,
            (-m.r3c0 * s3 + m.r3c1 * s1 - m.r3c2 * s0) * determinant,
            (m.r2c0 * s3 - m.r2c1 * s1 + m.r2c2 * s0) * determinant]);
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
        matrix.r2c3 = -1 / distance;
        return Matrix.multiply(this, matrix);
    }

    getRotate(): Vector3 {
        const toReg = (180 / Math.PI);
        const rotateY = Math.asin(-this.r0c2) * toReg;
        const rotateX = Math.atan2(this.r1c2, this.r2c2) * toReg;
        const rotateZ = Math.atan2(this.r0c1, this.r0c0) * toReg;
        return new Vector3(rotateX, rotateY, rotateZ);
    }

    rotate(angle: number): Matrix {
        return this.rotateZ(angle)
    }

    rotateX(angle: number): Matrix {
        const theta = (Math.PI / 180) * angle;
        const matrix = Matrix.identity();

        matrix.r1c1 = matrix.r2c2 = Math.cos(theta);
        matrix.r1c2 = matrix.r2c1 = Math.sin(theta);
        matrix.r2c1 *= -1;

        return Matrix.multiply(this, matrix);
    }

    rotateY(angle: number): Matrix {
        const theta = (Math.PI / 180) * angle;
        const matrix = Matrix.identity();

        matrix.r0c0 = matrix.r2c2 = Math.cos(theta);
        matrix.r0c2 = matrix.r2c0 = Math.sin(theta);
        matrix.r0c2 *= -1;

        return Matrix.multiply(this, matrix);
    }

    rotateZ(angle: number): Matrix {
        const theta = (Math.PI / 180) * angle;
        const matrix = Matrix.identity();

        matrix.r0c0 = matrix.r1c1 = Math.cos(theta);
        matrix.r0c1 = matrix.r1c0 = Math.sin(theta);
        matrix.r1c0 *= -1;

        return Matrix.multiply(this, matrix);
    }

    getScale(): Vector3 {
        const x = Math.sqrt(Math.pow(this.r0c0, 2) + Math.pow(this.r1c0, 2) + Math.pow(this.r2c0, 2));
        const y = Math.sqrt(Math.pow(this.r0c1, 2) + Math.pow(this.r1c1, 2) + Math.pow(this.r2c1, 2));
        const z = Math.sqrt(Math.pow(this.r0c2, 2) + Math.pow(this.r1c2, 2) + Math.pow(this.r2c2, 2));
        return new Vector3(x, y, z);
    }

    scale(scalar: number, scalarY: number = undefined): Matrix {
        const matrix = Matrix.identity();

        matrix.r0c0 = scalar;
        matrix.r1c1 = typeof scalarY === 'number' ? scalarY : scalar;

        return Matrix.multiply(this, matrix);
    }

    scaleX(scalar: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r0c0 = scalar;
        return Matrix.multiply(this, matrix);
    }

    scaleY(scalar: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r1c1 = scalar;
        return Matrix.multiply(this, matrix);

    }

    scaleZ(scalar: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r2c2 = scalar;
        return Matrix.multiply(this, matrix);
    }

    getTranslate(): Vector3 {
        return new Vector3(this.r3c0, this.r3c1, this.r3c2);
    }

    translate(distanceX: number, distanceY: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r3c0 = distanceX;

        if (distanceY) {
            matrix.r3c1 = distanceY;
        }

        return Matrix.multiply(this, matrix);
    }

    translate3d(distanceX: number, distanceY: number, distanceZ: number): Matrix {
        const matrix = Matrix.identity();
        if (distanceX !== undefined && distanceY !== undefined && distanceZ !== undefined) {
            matrix.r3c0 = distanceX;
            matrix.r3c1 = distanceY;
            matrix.r3c2 = distanceZ;
        }
        return Matrix.multiply(this, matrix);
    }

    translateX(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r3c0 = distance;
        return Matrix.multiply(this, matrix);
    }

    translateY(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r3c1 = distance;
        return Matrix.multiply(this, matrix);
    }

    translateZ(distance: number): Matrix {
        const matrix = Matrix.identity();
        matrix.r3c2 = distance;
        return Matrix.multiply(this, matrix);
    }

    toString() {
        return ("matrix3d(" + (this.join(', ')) + ")")
    }
}