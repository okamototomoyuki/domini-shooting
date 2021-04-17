import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Vector2 from "../../engine/data/Vector2";
import MEntity from "../../engine/element/MEntity";

export default class Bullet extends MComponent {

    static Generate(screenPos: Vector2, rad: number) {
        const node = document.createElement('m-entity') as MEntity

        node.positionScreen = screenPos;
        node.r = rad;
        node.w = 10;
        node.h = 10;

        document.body.appendChild(node);
        const bullet = node.addComponent(Bullet) as Bullet;
        if (bullet) {
            bullet.#screenPos = screenPos;
            bullet.#rad = rad;
        }
    }

    #screenPos: Vector2 = new Vector2(0, 0);
    #rad: number = 0;

    start() {
        const e = this.entity;

        // e.positionScreen = this.#screenPos;
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