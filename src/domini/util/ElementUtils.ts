/**
 * Element のユーティリティ
 */
export default class ElementUtils {

    /**
     * 子孫ノードも含めて破棄
     * @param ele エレメント
     */
    static destoyRecursive(ele: Element) {
        for (let e of ele.children) {
            ElementUtils.destoyRecursive(e)
        }
        ele.remove();
    }
}