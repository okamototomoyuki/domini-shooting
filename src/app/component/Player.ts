import MComoponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Engine from "../../engine/Engine";

export default class Player extends MComoponent {

    update() {
        console.log(1);
        const d = Engine.delta;
        const e = this.entity;

        if (Input.isPressing("KeyW")) {
            e.translateScreenY(-d * 100);
        }
        if (Input.isPressing("KeyA")) {
            e.translateScreenX(-d * 100);
        }
        if (Input.isPressing("KeyS")) {
            e.translateScreenY(d * 100);
        }
        if (Input.isPressing("KeyD")) {
            e.translateScreenX(d * 100);
        }
        if (Input.isPressing("KeyQ")) {
            e.r += -d * 100;
        }
        if (Input.isPressing("KeyE")) {
            e.r += d * 100;
        }
        if (Input.isPressing("KeyZ")) {
            e.sx -= d * 10;
        }
        if (Input.isPressing("KeyC")) {
            e.sy -= d * 10;
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

        e.bg = e.collides.length > 0 ? "red" : "black";
    }
}
