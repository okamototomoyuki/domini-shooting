import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Bullet from "./Bullet";

export default class Gun extends MComponent {
    static list = new Array<Bullet>();

    update() {
        // for (const e of Gun.list) {
        //     if (e.isStart) {
        //         console.log(e.entity.positionScreen)
        //     }
        // }
        // Gun.list = [];//Gun.list.filter(e => e.isStart == false);


        if (Input.isDownMouseLeft) {
            const pos = this.entity.positionScreen;
            const rad = this.entity.radianScreen;
            Gun.list.push(Bullet.Generate(pos, rad));
        }
        // for (const e of Gun.list) {
        //     console.log(e.entity.positionScreen)
        // }
    }
}
