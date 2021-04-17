import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Vector2 from "../../engine/data/Vector2";
import MEntity from "../../engine/element/MEntity";
import MathUtils from "../../engine/util/MathUtils";

export default class Bullet extends MComponent {

    static Generate(screenPos: Vector2, rad: number): Bullet {
        const node = MEntity.generate();
        node.rad = rad;
        node.w = 10;
        node.h = 10;
        node.bg = "red";
        node.positionScreen = screenPos;
        return node.addComponent(Bullet) as Bullet
    }

    start() {
        const e = this.entity;

        // if (this.#screenPos) {
        // console.log("----")
        //     // e.positionScreen = this.#screenPos;
        // }
        // e.r = this.#rad;
        // e.w = 10;
        // e.h = 10;
    }

    update() {
        // const e = this.entity;
        // e.positionScreen = this.#screenPos;
        // e.r = this.#rad;
    }
}