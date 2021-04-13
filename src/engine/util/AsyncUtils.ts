/**
 * 通知計算のユーティリティ
 */
export default class AsyncUtils {

    /**
     * 度をラジアンに変換
     * @param deg 度
     * @returns ラジアン
     */
    static nextFrame(): Promise<number> {
        return new Promise(requestAnimationFrame);
    }
}