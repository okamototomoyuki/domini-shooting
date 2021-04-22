
/**
 * 通知計算のユーティリティ
 */
export default class MathUtils {

    /**
     * 度をラジアンに変換
     * @param deg 度
     * @returns ラジアン
     */
    static degToRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * ラジアンを度に変換
     * @param rad ラジアン
     * @returns 度
     */
    static radToDeg(rad: number): number {
        return rad / (Math.PI / 180);
    }

}