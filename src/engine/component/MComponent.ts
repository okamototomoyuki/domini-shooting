import MEntity from "../element/MEntity";
import Constructable from "../interface/Constructable";

export default class MComponent {
    static nameToComp = new Map<String, Constructable<MComponent>>();
    static registerComponent(name: String, compClass: Constructable<MComponent>) {
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
    static getAttributeName(compClass: Constructable<MComponent>): String | undefined {
        for (const e of this.nameToComp.entries()) {
            if (e[1] instanceof compClass) {
                return e[0];
            }
        }
        return undefined;
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
