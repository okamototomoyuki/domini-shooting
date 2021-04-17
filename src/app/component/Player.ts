import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Vector2 from "../../engine/data/Vector2";
import Engine from "../../engine/Engine";

export default class Player extends MComponent {

    update() {
        const d = Engine.delta;
        const e = this.entity;

        if (Input.isPressing("KeyW")) {
            e.translateScreenY(-d * 500);
        }
        if (Input.isPressing("KeyA")) {
            e.translateScreenX(-d * 500);
        }
        if (Input.isPressing("KeyS")) {
            e.translateScreenY(d * 500);
        }
        if (Input.isPressing("KeyD")) {
            e.translateScreenX(d * 500);
        }
        if (Input.isPressing("KeyQ")) {
            e.sx += -d * 100;
        }
        if (Input.isPressing("KeyE")) {
            e.sx += d * 100;
        }
        if (Input.isPressing("KeyZ")) {
            e.sy += -d * 100;
        }
        if (Input.isPressing("KeyC")) {
            e.sy += d * 100;
        }

        // if (Input.isPressing("KeyI")) {
        //     t2.translateScreenY(-d * 100);
        // }
        // if (Input.isPressing("KeyJ")) {
        //     t2.translateScreenX(-d * 100);
        // }
        // if (Input.isPressing("KeyK")) {
        //     t2.translateScreenY(d * 100);
        // }
        // if (Input.isPressing("KeyL")) {
        //     t2.translateScreenX(d * 100);
        // }
        // if (Input.isPressing("KeyU")) {
        //     t2.r += -d * 100;
        // }
        // if (Input.isPressing("KeyO")) {
        //     t2.r += d * 100;
        // }
        // if (Input.isPressing("KeyP")) {
        //     t3.r += -d * 100;
        // }
        // if (Input.isPressing("BracketLeft")) {
        //     t3.r += d * 100;
        // }

        e.loopAtScreen(Input.mousePosition);

        // e.bg = e.collides.length > 0 ? "red" : "black";
    }
}
