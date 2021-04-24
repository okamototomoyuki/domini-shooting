import MComponent from "../domini/component/MComponent";
import Input from "../domini/data/Input";
import MEntity from "../domini/element/MEntity";
import Domini from "../domini/Domini";
import Bullet from "./component/Bullet";
import Enemy from "./component/Enemy";
import Gun from "./component/Gun";
import Player from "./component/Player";
import View from './View.svelte'

export default class Game {

    static _STATE_WAITING = 0;
    static _STATE_PLAYING = 1;
    static _STATE_ENDING = 2;

    static _GENERATE_SPAN_DEFAULT = 3

    static view: View | undefined = undefined;

    static generateTime = 0;
    static generateSpan = Game._GENERATE_SPAN_DEFAULT;

    static _state = Game._STATE_WAITING;
    static get state() {
        return Game._state;
    }
    static set state(v: number) {
        Game._state = v;
        Game.view?.reload();
    }
    static _score = 0;
    static get score() {
        return Game._score;
    }
    static set score(v: number) {
        Game._score = v;
        Game.view?.reload();
    }

    static initialize() {
        Domini.start();

        MComponent.registerComponent("player", Player);
        MComponent.registerComponent("gun", Gun);
        MComponent.registerComponent("bullet", Bullet);
        MComponent.registerComponent("enemy", Enemy);

        // UI 作成
        Game.view = new View({
            target: document.body,
        });

        Player.generate();
        Game.generateSpan = Game._GENERATE_SPAN_DEFAULT;
        Game.generateTime = Game.generateSpan;
        Domini.addRequestAnimationFrame(Game.loop);
    }

    static loop() {
        if (Input.isDown("Space")) {
            if (Game.isStatePlaying == false) {
                Game.toPlayingState();
            }
        }

        const player = Player.instance;
        if (player && Game.isStatePlaying) {
            Game.generateTime += Domini.delta;
            if (Game.generateTime > Game.generateSpan) {
                Enemy.generate();
                Game.generateTime = 0;
                Game.generateSpan = Math.max(Game.generateSpan - 0.2, Gun.SPAN * 0.99);
            }
        }
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
        if (Player.instance == undefined || Player.instance.entity.isDestroy) {
            Player.generate();
        }
        Game.generateSpan = Game._GENERATE_SPAN_DEFAULT;
        Game.generateTime = Game.generateSpan;
        Game.state = Game._STATE_PLAYING;
    }
    static toEndingState() {
        Game.state = Game._STATE_ENDING;
    }
}
