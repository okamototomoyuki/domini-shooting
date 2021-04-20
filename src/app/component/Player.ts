import MComponent from "../../engine/component/MComponent";
import Input from "../../engine/data/Input";
import Vector2 from "../../engine/data/Vector2";
import MEntity from "../../engine/element/MEntity";
import Engine from "../../engine/Engine";
import Game from "../Game";
import Enemy from "./Enemy";
import Gun from "./Gun";

export default class Player extends MComponent {

    static instance: Player | undefined = undefined;

    static generate() {
        const node = MEntity.generate();

        const wScreen = document.body.offsetWidth;
        const hScreen = document.body.offsetHeight;
        node.w = 50;
        node.h = 50;
        node.positionScreen = new Vector2(wScreen / 2, hScreen / 2);
        Player.instance = node.addComponent(Player) as Player;

        const gun = MEntity.generate();
        node.appendChild(gun);
        gun.w = 25;
        gun.h = 25;
        gun.x = 37.5;
        gun.y = 12.5;
        gun.addComponent(Gun);
    }

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
        if (Input.isDownMouseLeft) {
            if (Game.isReady == false) {
                Game.isReady = true;
            }
        }

        e.loopAtScreen(Input.mousePosition);

        const wScreen = document.body.offsetWidth;
        const hScreen = document.body.offsetHeight;
        const pos = e.positionScreen;
        let isOut = false;
        if (pos.x < 0) {
            pos.x = 0;
            isOut = true;
        } else if (pos.x > wScreen) {
            pos.x = wScreen;
            isOut = true;
        }
        if (pos.y < 0) {
            pos.y = 0;
            isOut = true;
        } else if (pos.y > hScreen) {
            pos.y = hScreen;
            isOut = true;
        }
        if (isOut) {
            e.positionScreen = pos;
        }

        const enemyAttr = MComponent.getAttributeName(Enemy);
        if (enemyAttr && e.collides.some(e => e.attributes.getNamedItem(enemyAttr))) {
            e.remove();
        }
    }
}
