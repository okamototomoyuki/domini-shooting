import MComponent from "../engine/component/MComponent";
import Input from "../engine/data/Input";
import MEntity from "../engine/element/MEntity";
import Engine from "../engine/Engine";
import Bullet from "./component/Bullet";
import Enemy from "./component/Enemy";
import Gun from "./component/Gun";
import Player from "./component/Player";

export default class Game {

    static _STATE_WAITING = 0;
    static _STATE_PLAYING = 1;
    static _STATE_ENDING = 2;

    static generateTime = 0;
    static generateSpan = 3;

    static state = Game._STATE_WAITING;
    static score = 0;

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
        if (Input.isDown("SPACE")) {
            if (Game.isStatePlaying == false) {
                Game.toPlayingState();
            }
        }

        const player = Player.instance;
        if (player && Game.isStatePlaying) {
            Game.generateTime += Engine.delta;
            if (Game.generateTime > Game.generateSpan) {
                Enemy.generate();
                Game.generateTime = 0;
                Game.generateSpan = Math.max(Game.generateSpan - 0.2, Gun.SPAN * 0.99);
            }
        }
        requestAnimationFrame(Game.loop);
    }

    static get isStateWaiting(): Boolean {
        return Game.state == Game._STATE_WAITING;
    }
    static get isStatePlaying(): Boolean {
        return Game.state == Game._STATE_PLAYING;
    }
    static get isStateEnding(): Boolean {
        return Game.state == Game._STATE_ENDING;
    }
    static toPlayingState() {
        Enemy.destroyAll();
        Game.state = Game._STATE_PLAYING;
        Game.score = 0;
    }
    static toEndingState() {
        Game.state = Game._STATE_ENDING;
    }
}
