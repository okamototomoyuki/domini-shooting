import Input from "./data/Input";

export default class Engine {

    static prevDate = window.performance.now();
    static currentFrame = 0;
    static delta = 0;

    static start() {
        Input.initialize()

        this.loop()
    }

    static loop() {
        Engine.currentFrame = Engine.currentFrame + 1;

        const now = window.performance.now();
        Engine.delta = (now - Engine.prevDate) / 1000;
        Engine.prevDate = now;

        Input.update();

        requestAnimationFrame(Engine.loop);
    }
}