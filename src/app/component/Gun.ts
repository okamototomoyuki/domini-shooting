import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Engine from "../../engine/Engine";
import Bullet from "./Bullet";
import Enemy from "./Enemy";

export default class Gun extends MComponent {

    static SPAN = 0.4;
    interval = 0;

    update() {
        if (this.interval > 0) {
            this.interval -= Engine.delta;
        }

        if (Input.isPressingMouseLeft) {
            if (this.interval <= 0) {
                const pos = this.entity.positionScreen;
                const rad = this.entity.radianScreen;
                Bullet.generate(pos, rad);
                this.interval = Gun.SPAN;
            }
        }
    }
}
