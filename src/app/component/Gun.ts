import MComponent from "../../domini/component/MComponent";
import Input from "../../domini/data/Input";
import Domini from "../../domini/Domini";
import Bullet from "./Bullet";
import Enemy from "./Enemy";

export default class Gun extends MComponent {

    static SPAN = 0.4;
    interval = 0;

    update() {
        if (this.interval > 0) {
            this.interval -= Domini.delta;
        }

        if (Input.isDownMouseLeft) {
            if (this.interval <= 0) {
                const pos = this.entity.positionScreen;
                const rad = this.entity.radianScreen;
                Bullet.generate(pos, rad);
                this.interval = Gun.SPAN;
            }
        }
    }
}
