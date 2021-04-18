import MComponent from "../../engine/component/MComponent";
import Vector2 from "../../engine/data/Vector2";
import MEntity from "../../engine/element/MEntity";
import Engine from "../../engine/Engine";

export default class Bullet extends MComponent {

    static generate(screenPos: Vector2, rad: number): Bullet {
        const node = MEntity.generate();
        node.rad = rad;
        node.w = 10;
        node.h = 10;
        node.bg = "red";
        node.positionScreen = screenPos;
        return node.addComponent(Bullet) as Bullet
    }

    update() {
        const e = this.entity;
        const vecR = e.right.addVectors(e.origin.multiply(-1));
        e.position = e.position.addVectors(vecR.normalized.multiply(500).multiply(Engine.delta));
        if (e.isInBody == false) {
            e.remove();
        }
    }
}