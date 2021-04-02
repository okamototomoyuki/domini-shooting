import * as KeyCode from 'keycode-js';

/**
 * 矩形の Transform
 */
export default class Input {

    static map = new Map<string, number>();

    static initialize() {
        document.addEventListener("keydown", this._onKeyDown);
        document.addEventListener("keyup", this._onKeyUp);

    }

    static _onKeyDown(e: KeyboardEvent) {

    }

    static _onKeyUp(e: KeyboardEvent) {

    }
}