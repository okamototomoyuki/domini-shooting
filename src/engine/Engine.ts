import Input from "./data/Input";
import MEntity from "./element/MEntity";

export default class Engine {

    static prevDate = window.performance.now();
    static currentFrame = 0;
    static delta = 0;
    static loops: Array<() => void> = []

    static start() {
        Input.initialize()

        this.loop()
    }

    static loop() {
        Engine.currentFrame = Engine.currentFrame + 1;

        const now = window.performance.now();
        Engine.delta = (now - Engine.prevDate) / 1000;
        Engine.prevDate = now;

        MEntity.update();
        Input.update();
        for (const e of Engine.loops) {
            e();
        }

        requestAnimationFrame(Engine.loop);
    }

    static addRequestAnimationFrame(loop: () => void): void {
        Engine.loops.push(loop);
    }
}