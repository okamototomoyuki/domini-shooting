import MComoponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Bullet from "./Bullet";

export default class Gun extends MComoponent {

    update() {
        if (Input.isDownMouseLeft) {
            var pos = this.entity.positionScreen;
            var rot = this.entity.degreeScreen;
            Bullet.Generate(pos, rot);
        }
    }
}
