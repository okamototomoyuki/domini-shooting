import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Bullet from "./Bullet";

export default class Gun extends MComponent {

    update() {
        if (Input.isDownMouseLeft) {
            const pos = this.entity.positionScreen;
            const rad = this.entity.radianScreen;
            Bullet.Generate(pos, rad);
        }
    }
}
