import MEntity from "../element/MEntity";

interface Constructable<T> extends Function {
    new(...args: any[]): T;
}

export default class MComoponent {
    static nameToComp = new Map<String, Constructable<MComoponent>>();
    static registerComponent(name: String, compClass: Constructable<MComoponent>) {
        this.nameToComp.set(name, compClass);
    }
    static generateComponent(className: string): MComoponent | undefined {
        const factory = MComoponent.nameToComp.get(className);
        if (factory) {
            return new factory();
        } else {
            return undefined;
        }
    }

    entity: MEntity;

    constructor(entity: MEntity) {
        this.entity = entity;
    }

    start() {
    }

    update() {
    }

    onDestroy() {
    }
}
