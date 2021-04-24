
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    class MComponent {
        constructor(entity) {
            this.isStart = false;
            this.entity = entity;
        }
        static getClass(name) { return MComponent.nameToComp.get(name); }
        ;
        static registerComponent(name, compClass) {
            this.nameToComp.set(name, compClass);
        }
        static generateComponent(className) {
            const factory = MComponent.nameToComp.get(className);
            if (factory) {
                return new factory();
            }
            else {
                return undefined;
            }
        }
        static getAttributeName(compClass) {
            for (const e of this.nameToComp.entries()) {
                if (e[1] == compClass) {
                    return e[0];
                }
            }
            return undefined;
        }
        start() {
        }
        update() {
        }
        onDestroy() {
        }
    }
    MComponent.nameToComp = new Map();

    class Vector2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        addVectors(v) {
            return new Vector2(this.x + v.x, this.y + v.y);
        }
        multiply(v) {
            return new Vector2(this.x * v, this.y * v);
        }
        get normalized() {
            return this.multiply(1 / this.distance);
        }
        get distance() {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        }
        getDistance(pos) {
            return Math.sqrt(Math.pow(this.x - pos.x, 2) + Math.pow(this.y - pos.y, 2));
        }
        static cross(va, vb) {
            return va.x * vb.y - va.y * vb.x;
        }
        static isCrossXY(aFrom, aTo, bFrom, bTo) {
            const ta = (bFrom.x - bTo.x) * (aFrom.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aFrom.x);
            const tb = (bFrom.x - bTo.x) * (aTo.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aTo.x);
            const tc = (aFrom.x - aTo.x) * (bFrom.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bFrom.x);
            const td = (aFrom.x - aTo.x) * (bTo.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bTo.x);
            return tc * td < 0 && ta * tb < 0;
        }
    }

    class ElementUtils {
        static destoyRecursive(ele) {
            for (let e of ele.children) {
                ElementUtils.destoyRecursive(e);
            }
            ele.remove();
        }
    }

    class MathUtils {
        static degToRad(deg) {
            return deg * (Math.PI / 180);
        }
        static radToDeg(rad) {
            return rad / (Math.PI / 180);
        }
    }

    class Vertex extends HTMLElement {
        static new(trans, type) {
            const node = document.createElement('m-vertex');
            trans.appendChild(node);
            const style = node.style;
            style.position = "absolute";
            style.width = "0px";
            style.height = "0px";
            switch (type) {
                case Vertex.TYPE_LT:
                    break;
                case Vertex.TYPE_RT:
                    style.left = "100%";
                    break;
                case Vertex.TYPE_RB:
                    style.top = "100%";
                    style.left = "100%";
                    break;
                case Vertex.TYPE_LB:
                    style.top = "100%";
                    break;
            }
            return node;
        }
        get positionScreen() {
            const bound = this.getBoundingClientRect();
            return new Vector2(bound.x, bound.y);
        }
    }
    Vertex.TYPE_LT = 0;
    Vertex.TYPE_RT = 1;
    Vertex.TYPE_RB = 2;
    Vertex.TYPE_LB = 3;
    customElements.define("m-vertex", Vertex);

    class MEntity extends HTMLElement {
        constructor() {
            super(...arguments);
            this.vertices = [];
            this.nameToComponent = new Map();
            this.collides = [];
            this.notCollides = [];
            this.bufferVertexPos = [];
            this.bufferPositionScreen = new Vector2(0, 0);
            this.bufferRadius = 0;
        }
        static generate() {
            const node = document.createElement('m-entity');
            document.body.appendChild(node);
            node.initializeIfNotYet();
            return node;
        }
        static update() {
            MEntity.calcCollides();
            for (const e of this.list) {
                if (e.isDestroy == false) {
                    e.update();
                }
                else {
                    e.onDestroy();
                }
            }
        }
        static calcCollides() {
            for (const e of MEntity.list) {
                e.collides = [];
                e.notCollides = [];
                e.computeBuffer();
            }
            for (const e of MEntity.list) {
                e.calcCollides();
            }
        }
        connectedCallback() {
            this.initializeIfNotYet();
        }
        initializeIfNotYet() {
            if (MEntity.list.includes(this) == false) {
                MEntity.list.push(this);
                this.vertices = [
                    Vertex.new(this, Vertex.TYPE_LT),
                    Vertex.new(this, Vertex.TYPE_RT),
                    Vertex.new(this, Vertex.TYPE_RB),
                    Vertex.new(this, Vertex.TYPE_LB),
                ];
                const style = this.style;
                const computeStyle = getComputedStyle(this, null);
                if (style.getPropertyValue("--x") == "") {
                    this.x = 0;
                }
                if (style.getPropertyValue("--y") == "") {
                    this.y = 0;
                }
                if (style.getPropertyValue("--rad") == "") {
                    this.rad = 0;
                }
                if (style.getPropertyValue("--sx") == "") {
                    this.sx = 1;
                }
                if (style.getPropertyValue("--sy") == "") {
                    this.sy = 1;
                }
                const w = style.getPropertyValue("--w").replace("px", "");
                this.w = w ? Number(w) : Number(computeStyle.width.replace("px", ""));
                const h = style.getPropertyValue("--h").replace("px", "");
                this.h = h ? Number(h) : Number(computeStyle.height.replace("px", ""));
            }
        }
        update() {
            const nameToComp = new Map(this.nameToComponent);
            const attrs = [...this.attributes];
            for (const attr of attrs) {
                let comp = nameToComp.get(attr.name);
                if (comp) {
                    nameToComp.delete(attr.name);
                }
                else {
                    const compClass = MComponent.getClass(attr.name);
                    if (compClass) {
                        comp = this.addComponent(compClass);
                        if (comp) {
                            comp.entity = this;
                            this.nameToComponent.set(attr.name, comp);
                        }
                    }
                }
                if (comp) {
                    if (comp.isStart == false) {
                        comp.start();
                        comp.isStart = true;
                    }
                    comp.update();
                }
            }
            for (const comp of nameToComp.values()) {
                comp.onDestroy();
            }
        }
        onDestroy() {
            for (const comp of this.nameToComponent.values()) {
                comp.onDestroy();
            }
        }
        get x() {
            const x = this.style.getPropertyValue("--x");
            return x ? Number(x.replace("px", "")) : 0;
        }
        set x(x) {
            this.style.setProperty("--x", `${x}px`);
        }
        get y() {
            const y = this.style.getPropertyValue("--y");
            return y ? Number(y.replace("px", "")) : 0;
        }
        set y(y) {
            this.style.setProperty("--y", `${y}px`);
        }
        get rad() {
            const r = this.style.getPropertyValue("--rad");
            return r ? Number(r.replace("rad", "")) : 0;
        }
        set rad(r) {
            this.style.setProperty("--rad", `${r}rad`);
        }
        get sx() {
            const sx = this.style.getPropertyValue("--sx");
            return sx ? Number(sx) : 1;
        }
        set sx(sx) {
            this.style.setProperty("--sx", `${sx}`);
        }
        get sy() {
            const sy = this.style.getPropertyValue("--sy");
            return sy ? Number(sy) : 1;
        }
        set sy(sy) {
            this.style.setProperty("--sy", `${sy}`);
        }
        get w() {
            const w = this.style.getPropertyValue("--w");
            return w ? Number(w.replace("px", "")) : 1;
        }
        set w(w) {
            this.style.setProperty("--w", `${w}px`);
        }
        get h() {
            const h = this.style.getPropertyValue("--h");
            return h ? Number(h.replace("px", "")) : 1;
        }
        set h(h) {
            this.style.setProperty("--h", `${h}px`);
        }
        get bg() {
            const bg = this.style.getPropertyValue("--bg");
            return bg ? bg : "black";
        }
        set bg(bg) {
            this.style.setProperty("--bg", bg);
        }
        get position() {
            return new Vector2(this.x, this.y);
        }
        set position(v) {
            this.x = v.x;
            this.y = v.y;
        }
        get scale() {
            return new Vector2(this.sx, this.sy);
        }
        set scale(v) {
            this.sx = v.x;
            this.sy = v.y;
        }
        get parentRad() {
            return this.radianScreen - this.rad;
        }
        get parentSx() {
            return this.scaleScreenX / this.sx;
        }
        get parentSy() {
            return this.scaleScreenY / this.sy;
        }
        get origin() {
            return this.vertices[Vertex.TYPE_LT].positionScreen.addVectors(this.vertices[Vertex.TYPE_RB].positionScreen).multiply(0.5);
        }
        get top() {
            return this.vertices[Vertex.TYPE_LT].positionScreen.addVectors(this.vertices[Vertex.TYPE_RT].positionScreen).multiply(0.5);
        }
        get bottom() {
            return this.vertices[Vertex.TYPE_LB].positionScreen.addVectors(this.vertices[Vertex.TYPE_RB].positionScreen).multiply(0.5);
        }
        get left() {
            return this.vertices[Vertex.TYPE_LT].positionScreen.addVectors(this.vertices[Vertex.TYPE_LB].positionScreen).multiply(0.5);
        }
        get right() {
            return this.vertices[Vertex.TYPE_RT].positionScreen.addVectors(this.vertices[Vertex.TYPE_RB].positionScreen).multiply(0.5);
        }
        get positionScreen() {
            return this.origin;
        }
        set positionScreen(screenPos) {
            let toVector = screenPos.addVectors(this.positionScreen.multiply(-1));
            this.translateScreen(toVector.x, toVector.y);
        }
        get radianScreen() {
            const vec = this.right.addVectors(this.origin.multiply(-1));
            return Math.atan2(vec.y, vec.x);
        }
        get degreeScreen() {
            return MathUtils.radToDeg(this.radianScreen);
        }
        get scaleScreenX() {
            const vec = this.right.addVectors(this.left.multiply(-1));
            return vec.distance / this.offsetWidth;
        }
        get scaleScreenY() {
            const vec = this.bottom.addVectors(this.top.multiply(-1));
            return vec.distance / this.offsetHeight;
        }
        translateScreenX(x) {
            const parentRad = this.parentRad;
            this.x += x * Math.cos(-parentRad) * this.parentSx;
            this.y += x * Math.sin(-parentRad) * this.parentSy;
        }
        translateScreenY(y) {
            const parentRad = this.parentRad;
            this.x += -y * Math.cos(-(parentRad + Math.PI / 2)) * this.parentSx;
            this.y += -y * Math.sin(-(parentRad + Math.PI / 2)) * this.parentSy;
        }
        translateScreen(x, y) {
            const parentRad = this.parentRad;
            this.x += (x * Math.cos(-parentRad) - y * Math.cos(-(parentRad + Math.PI / 2))) * this.parentSx;
            this.y += (x * Math.sin(-parentRad) - y * Math.sin(-(parentRad + Math.PI / 2))) * this.parentSx;
        }
        computeBuffer() {
            this.bufferVertexPos = [this.vertices[Vertex.TYPE_LT].positionScreen, this.vertices[Vertex.TYPE_RT].positionScreen, this.vertices[Vertex.TYPE_RB].positionScreen, this.vertices[Vertex.TYPE_LB].positionScreen];
            this.bufferPositionScreen = this.positionScreen;
            this.bufferRadius = this.radius;
        }
        ;
        get radius() {
            return this.origin.getDistance(this.vertices[Vertex.TYPE_RT].positionScreen);
        }
        get parentNode() {
            return this.parentNode;
        }
        calcCollides() {
            const selfVs = this.bufferVertexPos;
            const subSVs = [selfVs[0].multiply(-1), selfVs[1].multiply(-1), selfVs[2].multiply(-1), selfVs[3].multiply(-1)];
            for (const otherT of MEntity.list) {
                if (otherT != this && this.collides.includes(otherT) == false && this.notCollides.includes(otherT) == false) {
                    const otherVs = otherT.bufferVertexPos;
                    const subOVs = [otherVs[0].multiply(-1), otherVs[1].multiply(-1), otherVs[2].multiply(-1), otherVs[3].multiply(-1)];
                    let isCollide = false;
                    const length = otherT.bufferPositionScreen.getDistance(this.bufferPositionScreen);
                    if (length < (otherT.bufferRadius + this.bufferRadius)) {
                        if (Vector2.isCrossXY(selfVs[0], selfVs[1], otherVs[0], otherVs[1])
                            || Vector2.isCrossXY(selfVs[0], selfVs[1], otherVs[1], otherVs[2])
                            || Vector2.isCrossXY(selfVs[0], selfVs[1], otherVs[2], otherVs[3])
                            || Vector2.isCrossXY(selfVs[0], selfVs[1], otherVs[3], otherVs[0])
                            || Vector2.isCrossXY(selfVs[1], selfVs[2], otherVs[0], otherVs[1])
                            || Vector2.isCrossXY(selfVs[1], selfVs[2], otherVs[1], otherVs[2])
                            || Vector2.isCrossXY(selfVs[1], selfVs[2], otherVs[2], otherVs[3])
                            || Vector2.isCrossXY(selfVs[1], selfVs[2], otherVs[3], otherVs[0])
                            || Vector2.isCrossXY(selfVs[2], selfVs[3], otherVs[0], otherVs[1])
                            || Vector2.isCrossXY(selfVs[2], selfVs[3], otherVs[1], otherVs[2])
                            || Vector2.isCrossXY(selfVs[2], selfVs[3], otherVs[2], otherVs[3])
                            || Vector2.isCrossXY(selfVs[2], selfVs[3], otherVs[3], otherVs[0])
                            || Vector2.isCrossXY(selfVs[3], selfVs[0], otherVs[0], otherVs[1])
                            || Vector2.isCrossXY(selfVs[3], selfVs[0], otherVs[1], otherVs[2])
                            || Vector2.isCrossXY(selfVs[3], selfVs[0], otherVs[2], otherVs[3])
                            || Vector2.isCrossXY(selfVs[3], selfVs[0], otherVs[3], otherVs[0])) {
                            isCollide = true;
                        }
                        else {
                            for (const subSV of subSVs) {
                                const otherVA = otherVs[0].addVectors(subSV);
                                const otherVB = otherVs[1].addVectors(subSV);
                                const otherVC = otherVs[2].addVectors(subSV);
                                const otherVD = otherVs[3].addVectors(subSV);
                                const crossAB = Vector2.cross(otherVA, otherVB);
                                const crossBC = Vector2.cross(otherVB, otherVC);
                                const crossCD = Vector2.cross(otherVC, otherVD);
                                const crossDA = Vector2.cross(otherVD, otherVA);
                                if (crossAB * crossBC > 0
                                    && crossBC * crossCD > 0
                                    && crossCD * crossDA > 0
                                    && crossDA * crossAB > 0) {
                                    isCollide = true;
                                    break;
                                }
                            }
                            if (isCollide == false) {
                                for (const subOV of subOVs) {
                                    const selfVA = selfVs[0].addVectors(subOV);
                                    const selfVB = selfVs[1].addVectors(subOV);
                                    const selfVC = selfVs[2].addVectors(subOV);
                                    const selfVD = selfVs[3].addVectors(subOV);
                                    const crossAB = Vector2.cross(selfVA, selfVB);
                                    const crossBC = Vector2.cross(selfVB, selfVC);
                                    const crossCD = Vector2.cross(selfVC, selfVD);
                                    const crossDA = Vector2.cross(selfVD, selfVA);
                                    if (crossAB * crossBC > 0
                                        && crossBC * crossCD > 0
                                        && crossCD * crossDA > 0
                                        && crossDA * crossAB > 0) {
                                        isCollide = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (isCollide) {
                            this.collides.push(otherT);
                            otherT.collides.push(this);
                        }
                        else {
                            this.notCollides.push(otherT);
                            otherT.notCollides.push(this);
                        }
                    }
                }
            }
        }
        loopAtScreen(targetPos) {
            const targetVec = targetPos.addVectors(this.origin.multiply(-1));
            const targetRad = Math.atan2(targetVec.y, targetVec.x);
            const baseVec = this.right.addVectors(this.origin.multiply(-1));
            const baseRad = Math.atan2(baseVec.y, baseVec.x);
            this.rad += targetRad - baseRad;
        }
        addComponent(compClass) {
            const attrName = MComponent.getAttributeName(compClass);
            if (attrName) {
                let comp = new compClass();
                if (comp) {
                    comp.entity = this;
                    this.nameToComponent.set(attrName, comp);
                    if (this.attributes.getNamedItem(attrName) == null) {
                        this.setAttribute(attrName, "");
                    }
                }
                return comp;
            }
            return undefined;
        }
        hasComponent(compClass) {
            const attrName = MComponent.getAttributeName(compClass);
            if (attrName) {
                return this.nameToComponent.has(attrName);
            }
            return false;
        }
        destroy() {
            ElementUtils.destoyRecursive(this);
        }
        get isInBody() {
            const rect = document.body.getBoundingClientRect();
            const pos = this.positionScreen;
            return 0 < pos.x && pos.x < rect.width && 0 < pos.y && pos.y < rect.height;
        }
        get isDestroy() {
            return this.parentElement == null;
        }
    }
    MEntity.list = new Array();
    customElements.define("m-entity", MEntity);

    class Domini {
        static start() {
            Input.initialize();
            this.loop();
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
        static addRequestAnimationFrame(loop) {
            Domini.loops.push(loop);
        }
    }
    Domini.prevDate = window.performance.now();
    Domini.currentFrame = 0;
    Domini.delta = 0;
    Domini.loops = [];

    class Input {
        static initialize() {
            document.addEventListener("keydown", Input._onKeyDown);
            document.addEventListener("keyup", Input._onKeyUp);
            document.addEventListener("mousemove", Input._onMouseMove);
            document.body.addEventListener("mousedown", Input._onMouseDown);
            document.body.addEventListener("mouseup", Input._onMouseUp);
            document.body.addEventListener("wheel", Input._onMouseWheel);
            Input.update();
        }
        static update() {
            for (let key of Input.keyToState.keys()) {
                let state = Input.keyToState.get(key);
                let downFrame = Input.keyToDownFrame.get(key);
                let upFrame = Input.keyToUpFrame.get(key);
                if (state == 2 && downFrame && downFrame <= Domini.currentFrame - 2) {
                    Input.keyToState.set(key, 1);
                }
                else if (state == -1 && upFrame && upFrame <= Domini.currentFrame - 2) {
                    Input.keyToState.set(key, 0);
                }
            }
            if (Input.wheelFrame < Domini.currentFrame - 1) {
                Input.wheel = 0;
            }
        }
        static _onKeyDown(e) {
            Input.keyToDownFrame.set(e.code, Domini.currentFrame);
            Input.keyToState.set(e.code, 2);
        }
        static _onKeyUp(e) {
            Input.keyToUpFrame.set(e.code, Domini.currentFrame);
            Input.keyToState.set(e.code, -1);
        }
        static _onMouseMove(e) {
            Input.mousePosition = new Vector2(e.clientX, e.clientY);
        }
        static _onMouseDown(e) {
            switch (e.button) {
                case 0:
                    Input.keyToDownFrame.set(Input._MOUSE_LEFT, Domini.currentFrame);
                    Input.keyToState.set(Input._MOUSE_LEFT, 2);
                case 1:
                    Input.keyToDownFrame.set(Input._MOUSE_MIDDLE, Domini.currentFrame);
                    Input.keyToState.set(Input._MOUSE_MIDDLE, 2);
                case 2:
                    Input.keyToDownFrame.set(Input._MOUSE_RIGHT, Domini.currentFrame);
                    Input.keyToState.set(Input._MOUSE_RIGHT, 2);
            }
        }
        static _onMouseUp(e) {
            switch (e.button) {
                case 0:
                    Input.keyToUpFrame.set(Input._MOUSE_LEFT, Domini.currentFrame);
                    Input.keyToState.set(Input._MOUSE_LEFT, -1);
                case 1:
                    Input.keyToUpFrame.set(Input._MOUSE_MIDDLE, Domini.currentFrame);
                    Input.keyToState.set(Input._MOUSE_MIDDLE, -1);
                case 2:
                    Input.keyToUpFrame.set(Input._MOUSE_RIGHT, Domini.currentFrame);
                    Input.keyToState.set(Input._MOUSE_RIGHT, -1);
            }
        }
        static _onMouseWheel(e) {
            Input.wheelFrame = Domini.currentFrame;
            Input.wheel = e.deltaY;
        }
        static isUp(code) {
            if (Input.keyToState.has(code)) {
                return Input.keyToState.get(code) == -1;
            }
            return false;
        }
        static isNotPress(code) {
            const v = Input.keyToState.get(code);
            return v == 0 || v == -1;
        }
        static isDown(code) {
            return Input.keyToState.get(code) == 2;
        }
        static isPressing(code) {
            const v = Input.keyToState.get(code);
            return v == 1 || v == 2;
        }
        static get isUpMouseLeft() {
            return Input.keyToState.get(Input._MOUSE_LEFT) == -1;
        }
        static get isNotPressMouseLeft() {
            const v = Input.keyToState.get(Input._MOUSE_LEFT);
            return v == -1 || v == 0;
        }
        static get isDownMouseLeft() {
            return Input.keyToState.get(Input._MOUSE_LEFT) == 2;
        }
        static get isPressingMouseLeft() {
            const v = Input.keyToState.get(Input._MOUSE_LEFT);
            return v == 1 || v == 2;
        }
        static get isUpMouseRight() {
            return Input.keyToState.get(Input._MOUSE_RIGHT) == -1;
        }
        static get isNotPressMouseRight() {
            const v = Input.keyToState.get(Input._MOUSE_RIGHT);
            return v == -1 || v == 0;
        }
        static get isDownMouseRight() {
            return Input.keyToState.get(Input._MOUSE_RIGHT) == 2;
        }
        static get isPressingMouseRight() {
            const v = Input.keyToState.get(Input._MOUSE_RIGHT);
            return v == 1 || v == 2;
        }
        static get isUpMouseMiddle() {
            return Input.keyToState.get(Input._MOUSE_MIDDLE) == -1;
        }
        static get isNotPressMouseMiddle() {
            const v = Input.keyToState.get(Input._MOUSE_MIDDLE);
            return v == -1 || v == 0;
        }
        static get isDownMouseMiddle() {
            return Input.keyToState.get(Input._MOUSE_MIDDLE) == 2;
        }
        static get isPressingMouseMiddle() {
            const v = Input.keyToState.get(Input._MOUSE_MIDDLE);
            return v == 1 || v == 2;
        }
    }
    Input._MOUSE_LEFT = "_MOUSE_LEFT";
    Input._MOUSE_RIGHT = "_MOUSE_RIGHT";
    Input._MOUSE_MIDDLE = "_MOUSE_MIDDLE";
    Input.keyToState = new Map();
    Input.keyToDownFrame = new Map();
    Input.keyToUpFrame = new Map();
    Input.mousePosition = new Vector2(0, 0);
    Input.wheelFrame = 0;
    Input.wheel = 0;

    class Bullet extends MComponent {
        static generate(screenPos, rad) {
            const node = MEntity.generate();
            node.rad = rad;
            node.w = 10;
            node.h = 10;
            node.bg = "red";
            node.positionScreen = screenPos;
            return node.addComponent(Bullet);
        }
        update() {
            const e = this.entity;
            const vecR = e.right.addVectors(e.origin.multiply(-1));
            e.position = e.position.addVectors(vecR.normalized.multiply(500).multiply(Domini.delta));
            if (e.isInBody == false) {
                e.destroy();
            }
        }
    }

    class Gun extends MComponent {
        constructor() {
            super(...arguments);
            this.interval = 0;
        }
        update() {
            if (this.interval > 0) {
                this.interval -= Domini.delta;
            }
            if (Input.isDownMouseLeft) {
                if (this.interval <= 0) {
                    const pos = this.entity.positionScreen;
                    const rad = this.entity.radianScreen;
                    Bullet.generate(pos, rad);
                    this.interval = Gun.SPAN;
                }
            }
        }
    }
    Gun.SPAN = 0.4;

    class Player extends MComponent {
        static generate() {
            const node = MEntity.generate();
            const wScreen = document.body.offsetWidth;
            const hScreen = document.body.offsetHeight;
            node.w = 50;
            node.h = 50;
            node.positionScreen = new Vector2(wScreen / 2, hScreen / 2);
            Player.instance = node.addComponent(Player);
            const gun = MEntity.generate();
            node.appendChild(gun);
            gun.w = 25;
            gun.h = 25;
            gun.x = 37.5;
            gun.y = 12.5;
            gun.addComponent(Gun);
        }
        update() {
            const d = Domini.delta;
            const e = this.entity;
            if (Input.isPressing("KeyW")) {
                e.translateScreenY(-d * 500);
            }
            if (Input.isPressing("KeyA")) {
                e.translateScreenX(-d * 500);
            }
            if (Input.isPressing("KeyS")) {
                e.translateScreenY(d * 500);
            }
            if (Input.isPressing("KeyD")) {
                e.translateScreenX(d * 500);
            }
            e.loopAtScreen(Input.mousePosition);
            const wScreen = document.body.offsetWidth;
            const hScreen = document.body.offsetHeight;
            const pos = e.positionScreen;
            let isOut = false;
            if (pos.x < 0) {
                pos.x = 0;
                isOut = true;
            }
            else if (pos.x > wScreen) {
                pos.x = wScreen;
                isOut = true;
            }
            if (pos.y < 0) {
                pos.y = 0;
                isOut = true;
            }
            else if (pos.y > hScreen) {
                pos.y = hScreen;
                isOut = true;
            }
            if (isOut) {
                e.positionScreen = pos;
            }
            const enemyAttr = MComponent.getAttributeName(Enemy);
            if (enemyAttr && e.collides.some(e => e.attributes.getNamedItem(enemyAttr))) {
                e.destroy();
                Game.toEndingState();
            }
        }
    }
    Player.instance = undefined;

    class Enemy extends MComponent {
        static generate() {
            const node = MEntity.generate();
            let pos = null;
            const wScreen = document.body.clientWidth;
            const hScreen = document.body.clientHeight;
            if (Math.random() > 0.5) {
                if (Math.random() > 0.75) {
                    pos = new Vector2(-Enemy.WIDTH, Math.random() * hScreen);
                }
                else {
                    pos = new Vector2(wScreen + Enemy.WIDTH, Math.random() * hScreen);
                }
            }
            else {
                if (Math.random() > 0.25) {
                    pos = new Vector2(Math.random() * wScreen, -Enemy.HEIGHT);
                }
                else {
                    pos = new Vector2(Math.random() * wScreen, hScreen + Enemy.WIDTH);
                }
            }
            node.w = Enemy.WIDTH;
            node.h = Enemy.HEIGHT;
            node.positionScreen = pos;
            node.bg = "blue";
            return node.addComponent(Enemy);
        }
        static destroyAll() {
            for (const e of MEntity.list) {
                if (e.hasComponent(Enemy)) {
                    e.destroy();
                }
            }
        }
        update() {
            const player = Player.instance;
            const e = this.entity;
            if (player) {
                if (player.entity.isDestroy == false) {
                    this.entity.loopAtScreen(player.entity.positionScreen);
                    const vecR = e.right.addVectors(e.origin.multiply(-1));
                    e.position = e.position.addVectors(vecR.normalized.multiply(50).multiply(Domini.delta));
                }
            }
            const bulletAttr = MComponent.getAttributeName(Bullet);
            if (bulletAttr) {
                const bullet = e.collides.find(e => e.attributes.getNamedItem(bulletAttr));
                if (bullet) {
                    Game.score += 1;
                    bullet.destroy();
                    e.destroy();
                }
            }
        }
    }
    Enemy.WIDTH = 100;
    Enemy.HEIGHT = 100;

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\app\View.svelte generated by Svelte v3.35.0 */
    const file = "src\\app\\View.svelte";

    // (25:3) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("スペース：最初から");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(25:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:33) 
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("敵を撃て！");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(23:33) ",
    		ctx
    	});

    	return block;
    }

    // (21:3) {#if Game.isStateWaiting}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("スペース: ゲーム開始");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:3) {#if Game.isStateWaiting}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let p0;
    	let t2;
    	let t3_value = /*Game*/ ctx[0].score + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let br0;
    	let t6;
    	let br1;
    	let t7;
    	let br2;
    	let t8;
    	let p2;
    	let b;
    	let t9;
    	let p3;
    	let a;

    	function select_block_type(ctx, dirty) {
    		if (/*Game*/ ctx[0].isStateWaiting) return create_if_block;
    		if (/*Game*/ ctx[0].isStatePlaying) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "DOM Shooting Game";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("スコア: ");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("WASD : 移動");
    			br0 = element("br");
    			t6 = text("\n\t\tマウス移動 : 回転");
    			br1 = element("br");
    			t7 = text("\n\t\t左クリック : 弾発射");
    			br2 = element("br");
    			t8 = space();
    			p2 = element("p");
    			b = element("b");
    			if_block.c();
    			t9 = space();
    			p3 = element("p");
    			a = element("a");
    			a.textContent = "ミニゲー";
    			add_location(h1, file, 9, 1, 185);
    			add_location(p0, file, 10, 1, 213);
    			add_location(br0, file, 14, 11, 259);
    			add_location(br1, file, 15, 12, 278);
    			add_location(br2, file, 16, 13, 298);
    			add_location(p1, file, 13, 1, 244);
    			add_location(b, file, 19, 2, 318);
    			add_location(p2, file, 18, 1, 312);
    			attr_dev(a, "href", "/");
    			add_location(a, file, 30, 2, 465);
    			add_location(p3, file, 29, 1, 459);
    			add_location(div, file, 8, 0, 178);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			append_dev(p1, br0);
    			append_dev(p1, t6);
    			append_dev(p1, br1);
    			append_dev(p1, t7);
    			append_dev(p1, br2);
    			append_dev(div, t8);
    			append_dev(div, p2);
    			append_dev(p2, b);
    			if_block.m(b, null);
    			append_dev(div, t9);
    			append_dev(div, p3);
    			append_dev(p3, a);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Game*/ 1 && t3_value !== (t3_value = /*Game*/ ctx[0].score + "")) set_data_dev(t3, t3_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(b, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("View", slots, []);

    	const reload = () => {
    		$$invalidate(0, Game);
    	};

    	onMount(() => {
    		
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<View> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ onMount, Game, reload });
    	return [Game, reload];
    }

    class View extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { reload: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "View",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get reload() {
    		return this.$$.ctx[1];
    	}

    	set reload(value) {
    		throw new Error("<View>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Game {
        static get state() {
            return Game._state;
        }
        static set state(v) {
            var _a;
            Game._state = v;
            (_a = Game.view) === null || _a === void 0 ? void 0 : _a.reload();
        }
        static get score() {
            return Game._score;
        }
        static set score(v) {
            var _a;
            Game._score = v;
            (_a = Game.view) === null || _a === void 0 ? void 0 : _a.reload();
        }
        static initialize() {
            Domini.start();
            MComponent.registerComponent("player", Player);
            MComponent.registerComponent("gun", Gun);
            MComponent.registerComponent("bullet", Bullet);
            MComponent.registerComponent("enemy", Enemy);
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
        static get isStateWaiting() {
            return Game.state == Game._STATE_WAITING;
        }
        static get isStatePlaying() {
            return Game.state == Game._STATE_PLAYING;
        }
        static get isStateEnding() {
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
    Game._STATE_WAITING = 0;
    Game._STATE_PLAYING = 1;
    Game._STATE_ENDING = 2;
    Game._GENERATE_SPAN_DEFAULT = 3;
    Game.view = undefined;
    Game.generateTime = 0;
    Game.generateSpan = Game._GENERATE_SPAN_DEFAULT;
    Game._state = Game._STATE_WAITING;
    Game._score = 0;

    Game.initialize();

}());
//# sourceMappingURL=bundle.js.map
