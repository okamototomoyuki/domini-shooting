import Transform from "./ctrl/Transform";
import Input from "./data/Input";

export default class Engine {

    static prevDate = window.performance.now();
    static delta = 0;

    static start() {
        Input.initialize()
        Transform.initialize()

        this.loop()
    }

    static loop() {
        const now = window.performance.now();
        Engine.delta = (now - Engine.prevDate) / 1000;
        Engine.prevDate = now;

        Input.update();
        Transform.update();

        requestAnimationFrame(Engine.loop);
    }
}