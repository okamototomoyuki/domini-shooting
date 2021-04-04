/**
 * 矩形の Transform
 */
export default class Input {
    static map = new Map<string, number>();
    static isInit = false;

    static initializeIfNot() {
        if (this.isInit == false) {
            this.isInit = true;
            document.addEventListener("keydown", this._onKeyDown);
            document.addEventListener("keyup", this._onKeyUp);

            this.loop();
        }
    }

    static loop() {
        for (let key of Input.map.keys()) {
            let v = Input.map.get(key);
            if (v > 1) {
                Input.map.set(key, 1);
            } else if (v < 0) {
                Input.map.set(key, 0);
            }
        }

        requestAnimationFrame(Input.loop);
    }

    static _onKeyDown(e: KeyboardEvent) {
        Input.map.set(e.code, 2);
    }

    static _onKeyUp(e: KeyboardEvent) {
        Input.map.set(e.code, -1);
    }

    static isUp(code: string): boolean {
        this.initializeIfNot();
        if (Input.map.has(code)) {
            return Input.map.get(code) == -1;
        }
        return false;
    }

    static isNotPress(code: string): boolean {
        this.initializeIfNot();
        if (Input.map.has(code)) {
            return Input.map.get(code) <= 0;
        }
        return true;
    }

    static isDown(code: string): boolean {
        this.initializeIfNot();
        if (Input.map.has(code)) {
            return Input.map.get(code) == 2;
        }
        return false;
    }

    static isPressing(code: string): boolean {
        this.initializeIfNot();
        if (Input.map.has(code)) {
            return Input.map.get(code) > 0;
        }
        return false;
    }
}