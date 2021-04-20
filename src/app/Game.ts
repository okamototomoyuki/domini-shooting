import MComponent from "../engine/component/MComponent";
import Engine from "../engine/Engine";
import Bullet from "./component/Bullet";
import Enemy from "./component/Enemy";
import Gun from "./component/Gun";
import Player from "./component/Player";

export default class Game {

    static generateTime = 0;
    static generateSpan = 3;
    static isReady = false;

    static initialize() {
        Engine.start();
        MComponent.registerComponent("player", Player);
        MComponent.registerComponent("gun", Gun);
        MComponent.registerComponent("bullet", Bullet);
        MComponent.registerComponent("enemy", Enemy);

        Player.generate();
        Game.generateTime = Game.generateSpan;
        requestAnimationFrame(Game.loop);
    }

    static loop() {
        const player = Player.instance;
        if (player && Game.isReady) {
            Game.generateTime += Engine.delta;
            if (Game.generateTime > Game.generateSpan) {
                Enemy.generate();
                Game.generateTime = 0;
                Game.generateSpan = Math.max(Game.generateSpan - 0.2, Gun.SPAN * 0.99);
            }
        }
        requestAnimationFrame(Game.loop);
    }
}
