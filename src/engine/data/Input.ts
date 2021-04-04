import Transform from "../ctrl/Transform";
import Engine from "../Engine";
import Vector3 from "./Vector3";

/**
 * 入力
 */
export default class Input {
    static _MOUSE_LEFT = "_MOUSE_LEFT";
    static _MOUSE_RIGHT = "_MOUSE_RIGHT";
    static _MOUSE_MIDDLE = "_MOUSE_MIDDLE";

    static map = new Map<string, number>();
    static mousePosition = new Vector3(0, 0, 0);
    static wheelFrame = 0
    static wheel = 0

    static initialize() {
        document.addEventListener("keydown", this._onKeyDown);
        document.addEventListener("keyup", this._onKeyUp);
        document.addEventListener("mousemove", this._onMouseMove)
        document.body.addEventListener("mousedown", this._onMouseDown)
        document.body.addEventListener("mouseup", this._onMouseUp)
        document.body.addEventListener("wheel", this._onMouseWheel)

        this.update();
    }

    static update() {
        for (let key of Input.map.keys()) {
            let v = Input.map.get(key);
            if (v > 1) {
                Input.map.set(key, 1);
            } else if (v < 0) {
                Input.map.set(key, 0);
            }
        }
        if (Input.wheelFrame < Engine.currentFrame - 1) {
            Input.wheel = 0;
        }
    }

    static _onKeyDown(e: KeyboardEvent) {
        Input.map.set(e.code, 2);
    }

    static _onKeyUp(e: KeyboardEvent) {
        Input.map.set(e.code, -1);
    }

    static _onMouseMove(e: MouseEvent) {
        Input.mousePosition = new Vector3(e.clientX, e.clientY, 0);
    }

    static _onMouseDown(e: MouseEvent) {
        switch (e.button) {
            case 0:
                Input.map.set(this._MOUSE_LEFT, 2);
            case 1:
                Input.map.set(this._MOUSE_MIDDLE, 2);
            case 2:
                Input.map.set(this._MOUSE_RIGHT, 2);
        }
    }

    static _onMouseUp(e: MouseEvent) {
        switch (e.button) {
            case 0:
                Input.map.set(this._MOUSE_LEFT, -1);
            case 1:
                Input.map.set(this._MOUSE_MIDDLE, -1);
            case 2:
                Input.map.set(this._MOUSE_RIGHT, -1);
        }
    }

    static _onMouseWheel(e: WheelEvent) {
        Input.wheelFrame = Engine.currentFrame;
        Input.wheel = e.deltaY;
    }

    static isUp(code: string): boolean {
        if (Input.map.has(code)) {
            return Input.map.get(code) == -1;
        }
        return false;
    }

    static isNotPress(code: string): boolean {
        if (Input.map.has(code)) {
            return Input.map.get(code) <= 0;
        }
        return true;
    }

    static isDown(code: string): boolean {
        if (Input.map.has(code)) {
            return Input.map.get(code) == 2;
        }
        return false;
    }

    static isPressing(code: string): boolean {
        if (Input.map.has(code)) {
            return Input.map.get(code) > 0;
        }
        return false;
    }


    static get isUpMouseLeft(): boolean {
        if (Input.map.has(this._MOUSE_LEFT)) {
            return Input.map.get(this._MOUSE_LEFT) == -1;
        }
        return false;
    }

    static get isNotPressMouseLeft(): boolean {
        if (Input.map.has(this._MOUSE_LEFT)) {
            return Input.map.get(this._MOUSE_LEFT) <= 0;
        }
        return true;
    }

    static get isDownMouseLeft(): boolean {
        if (Input.map.has(this._MOUSE_LEFT)) {
            return Input.map.get(this._MOUSE_LEFT) == 2;
        }
        return false;
    }

    static get isPressingMouseLeft(): boolean {
        if (Input.map.has(this._MOUSE_LEFT)) {
            return Input.map.get(this._MOUSE_LEFT) > 0;
        }
        return false;
    }


    static get isUpMouseRight(): boolean {
        if (Input.map.has(this._MOUSE_RIGHT)) {
            return Input.map.get(this._MOUSE_RIGHT) == -1;
        }
        return false;
    }

    static get isNotPressMouseRight(): boolean {
        if (Input.map.has(this._MOUSE_RIGHT)) {
            return Input.map.get(this._MOUSE_RIGHT) <= 0;
        }
        return true;
    }

    static get isDownMouseRight(): boolean {
        if (Input.map.has(this._MOUSE_RIGHT)) {
            return Input.map.get(this._MOUSE_RIGHT) == 2;
        }
        return false;
    }

    static get isPressingMouseRight(): boolean {
        if (Input.map.has(this._MOUSE_RIGHT)) {
            return Input.map.get(this._MOUSE_RIGHT) > 0;
        }
        return false;
    }


    static get isUpMouseMiddle(): boolean {
        if (Input.map.has(this._MOUSE_MIDDLE)) {
            return Input.map.get(this._MOUSE_MIDDLE) == -1;
        }
        return false;
    }

    static get isNotPressMouseMiddle(): boolean {
        if (Input.map.has(this._MOUSE_MIDDLE)) {
            return Input.map.get(this._MOUSE_MIDDLE) <= 0;
        }
        return true;
    }

    static get isDownMouseMiddle(): boolean {
        if (Input.map.has(this._MOUSE_MIDDLE)) {
            return Input.map.get(this._MOUSE_MIDDLE) == 2;
        }
        return false;
    }

    static get isPressingMouseMiddle(): boolean {
        if (Input.map.has(this._MOUSE_MIDDLE)) {
            return Input.map.get(this._MOUSE_MIDDLE) > 0;
        }
        return false;
    }
}