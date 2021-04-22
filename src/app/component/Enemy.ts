
import MComponent from "../../domini/component/MComponent";
import Vector2 from "../../domini/data/Vector2";
import MEntity from "../../domini/element/MEntity";
import Domini from "../../domini/Domini";
import Game from "../Game";
import Bullet from "./Bullet";
import Player from "./Player";

export default class Enemy extends MComponent {
    static WIDTH = 100;
    static HEIGHT = 100;

    static generate(): Enemy {
        const node = MEntity.generate();
        let pos: Vector2 | null = null;

        const wScreen = document.body.clientWidth
        const hScreen = document.body.clientHeight
        if (Math.random() > 0.5) {
            if (Math.random() > 0.75) {
                pos = new Vector2(- Enemy.WIDTH, Math.random() * hScreen)
            } else {
                pos = new Vector2(wScreen + Enemy.WIDTH, Math.random() * hScreen)

            }
        } else {
            if (Math.random() > 0.25) {
                pos = new Vector2(Math.random() * wScreen, - Enemy.HEIGHT)
            } else {
                pos = new Vector2(Math.random() * wScreen, hScreen + Enemy.WIDTH)
            }
        }
        node.w = Enemy.WIDTH
        node.h = Enemy.HEIGHT
        node.positionScreen = pos;
        node.bg = "blue";
        return node.addComponent(Enemy) as Enemy
    }

    static destroyAll() {
        for (const e of MEntity.list) {
            if (e.hasComponent(Enemy)) {
                e.destroy();
            }
        }
    }

    update() {
        const player = Player.instance;
        const e = this.entity;
        if (player) {
            if (player.entity.isDestroy == false) {
                this.entity.loopAtScreen(player.entity.positionScreen);
                const vecR = e.right.addVectors(e.origin.multiply(-1));
                e.position = e.position.addVectors(vecR.normalized.multiply(50).multiply(Domini.delta));
            }
        }

        const bulletAttr = MComponent.getAttributeName(Bullet);
        if (bulletAttr) {
            const bullet = e.collides.find(e => e.attributes.getNamedItem(bulletAttr))
            if (bullet) {
                // ポイント加算
                Game.score += 1;

                // 破棄
                bullet.destroy();
                e.destroy();
            }
        }
    }
}