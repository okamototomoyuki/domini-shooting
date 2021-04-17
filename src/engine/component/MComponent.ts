import MEntity from "../element/MEntity";
import Constructable from "../interface/Constructable";

export default class MComponent {
    static nameToComp = new Map<string, Constructable<MComponent>>();
    static getClass(name: string): Constructable<MComponent> | undefined { return MComponent.nameToComp.get(name) };

    static registerComponent(name: string, compClass: Constructable<MComponent>) {
        this.nameToComp.set(name, compClass);
    }
    static generateComponent(className: string): MComponent | undefined {
        const factory = MComponent.nameToComp.get(className);
        if (factory) {
            return new factory();
        } else {
            return undefined;
        }
    }
    static getAttributeName(compClass: Constructable<MComponent>): string | undefined {
        for (const e of this.nameToComp.entries()) {
            if (e[1] == compClass) {
                return e[0];
            }
        }
        return undefined;
    }

    entity: MEntity;
    isStart = false;

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
