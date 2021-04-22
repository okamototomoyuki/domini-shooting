import Input from "./data/Input";
import MEntity from "./element/MEntity";

export default class Domini {

    static prevDate = window.performance.now();
    static currentFrame = 0;
    static delta = 0;
    static loops: Array<() => void> = []

    static start() {
        Input.initialize()

        this.loop()
    }

    static loop() {
        Domini.currentFrame = Domini.currentFrame + 1;

        const now = window.performance.now();
        Domini.delta = (now - Domini.prevDate) / 1000;
        Domini.prevDate = now;

        MEntity.update();
        Input.update();
        for (const e of Domini.loops) {
            e();
        }

        requestAnimationFrame(Domini.loop);
    }

    static addRequestAnimationFrame(loop: () => void): void {
        Domini.loops.push(loop);
    }
}