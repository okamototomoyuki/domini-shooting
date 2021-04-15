import Engine from "../Engine";
import Vector2 from "./Vector2";

/**
 * 入力
 */
export default class Input {
    static _MOUSE_LEFT = "_MOUSE_LEFT";
    static _MOUSE_RIGHT = "_MOUSE_RIGHT";
    static _MOUSE_MIDDLE = "_MOUSE_MIDDLE";

    static map = new Map<string, number>();
    static mousePosition = new Vector2(0, 0);
    static wheelFrame = 0
    static wheel = 0

    static initialize() {
        document.addEventListener("keydown", Input._onKeyDown);
        document.addEventListener("keyup", Input._onKeyUp);
        document.addEventListener("mousemove", Input._onMouseMove)
        document.body.addEventListener("mousedown", Input._onMouseDown)
        document.body.addEventListener("mouseup", Input._onMouseUp)
        document.body.addEventListener("wheel", Input._onMouseWheel)

        Input.update();
    }

    static update() {
        for (let key of Input.map.keys()) {
            let v = Input.map.get(key);
            if (v == 2) {
                Input.map.set(key, 1);
            } else if (v == -1) {
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
        Input.mousePosition = new Vector2(e.clientX, e.clientY);
    }

    static _onMouseDown(e: MouseEvent) {
        switch (e.button) {
            case 0:
                console.log(1);
                Input.map.set(Input._MOUSE_LEFT, 2);
            case 1:
                Input.map.set(Input._MOUSE_MIDDLE, 2);
            case 2:
                Input.map.set(Input._MOUSE_RIGHT, 2);
        }
    }

    static _onMouseUp(e: MouseEvent) {
        switch (e.button) {
            case 0:
                Input.map.set(Input._MOUSE_LEFT, -1);
            case 1:
                Input.map.set(Input._MOUSE_MIDDLE, -1);
            case 2:
                Input.map.set(Input._MOUSE_RIGHT, -1);
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
        const v = Input.map.get(code);
        return v == 0 || v == -1;
    }

    static isDown(code: string): boolean {
        return Input.map.get(code) == 2;
    }

    static isPressing(code: string): boolean {
        const v = Input.map.get(code)
        return v == 1 || v == 2;
    }


    static get isUpMouseLeft(): boolean {
        return Input.map.get(Input._MOUSE_LEFT) == -1
    }

    static get isNotPressMouseLeft(): boolean {
        const v = Input.map.get(Input._MOUSE_LEFT);
        return v == -1 || v == 0
    }

    static get isDownMouseLeft(): boolean {
        return Input.map.get(Input._MOUSE_LEFT) == 2;
    }

    static get isPressingMouseLeft(): boolean {
        const v = Input.map.get(Input._MOUSE_LEFT)
        return v == 1 || v == 2;
    }


    static get isUpMouseRight(): boolean {
        return Input.map.get(Input._MOUSE_RIGHT) == -1;
    }

    static get isNotPressMouseRight(): boolean {
        const v = Input.map.get(Input._MOUSE_RIGHT)
        return v == -1 || v == 0
    }

    static get isDownMouseRight(): boolean {
        return Input.map.get(Input._MOUSE_RIGHT) == 2;
    }

    static get isPressingMouseRight(): boolean {
        const v = Input.map.get(Input._MOUSE_RIGHT)
        return v == 1 || v == 2;
    }


    static get isUpMouseMiddle(): boolean {
        return Input.map.get(Input._MOUSE_MIDDLE) == -1;
    }

    static get isNotPressMouseMiddle(): boolean {
        const v = Input.map.get(Input._MOUSE_MIDDLE)
        return v == -1 || v == 0;
    }

    static get isDownMouseMiddle(): boolean {
        return Input.map.get(Input._MOUSE_MIDDLE) == 2;
    }

    static get isPressingMouseMiddle(): boolean {
        const v = Input.map.get(Input._MOUSE_MIDDLE)
        return v == 1 || v == 2;
    }
}