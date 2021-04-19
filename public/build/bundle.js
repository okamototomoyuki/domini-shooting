
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function detach(node) {
        node.parentNode.removeChild(node);
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

    class VertexData {
        constructor(a, b, c, d) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
        }
        get vertices() {
            return [this.a, this.b, this.c, this.d];
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
        }
        static generate() {
            const node = document.createElement('m-entity');
            document.body.appendChild(node);
            node.initializeIfNotYet();
            return node;
        }
        static update() {
            for (const e of this.list) {
                e.collides = [];
                e.notCollides = [];
            }
            for (const e of this.list) {
                e.calcCollides();
            }
            for (const e of this.list) {
                if (e.isDestroy == false) {
                    e.update();
                }
                else {
                    e.onDestroy();
                }
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
        computeVertexScreen() {
            return new VertexData(this.vertices[Vertex.TYPE_LT].positionScreen, this.vertices[Vertex.TYPE_RT].positionScreen, this.vertices[Vertex.TYPE_RB].positionScreen, this.vertices[Vertex.TYPE_LB].positionScreen);
        }
        ;
        get radius() {
            return this.origin.getDistance(this.vertices[Vertex.TYPE_RT].positionScreen);
        }
        get parentNode() {
            return this.parentNode;
        }
        calcCollides() {
            const selfVs = this.computeVertexScreen();
            const subSVs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];
            for (const otherT of MEntity.list) {
                if (otherT != this && this.collides.includes(otherT) == false && this.notCollides.includes(otherT) == false) {
                    const otherVs = otherT.computeVertexScreen();
                    const subOVs = [otherVs.a.multiply(-1), otherVs.b.multiply(-1), otherVs.c.multiply(-1), otherVs.d.multiply(-1)];
                    let isCollide = false;
                    const length = otherT.positionScreen.getDistance(this.positionScreen);
                    if (length < (otherT.radius + this.radius)) {
                        if (Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.a, otherVs.b)
                            || Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.b, otherVs.c)
                            || Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.c, otherVs.d)
                            || Vector2.isCrossXY(selfVs.a, selfVs.b, otherVs.d, otherVs.a)
                            || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.a, otherVs.b)
                            || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.b, otherVs.c)
                            || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.c, otherVs.d)
                            || Vector2.isCrossXY(selfVs.b, selfVs.c, otherVs.d, otherVs.a)
                            || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.a, otherVs.b)
                            || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.b, otherVs.c)
                            || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.c, otherVs.d)
                            || Vector2.isCrossXY(selfVs.c, selfVs.d, otherVs.d, otherVs.a)
                            || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.a, otherVs.b)
                            || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.b, otherVs.c)
                            || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.c, otherVs.d)
                            || Vector2.isCrossXY(selfVs.d, selfVs.a, otherVs.d, otherVs.a)) {
                            isCollide = true;
                        }
                        else {
                            for (const subSV of subSVs) {
                                const otherVA = otherVs.a.addVectors(subSV);
                                const otherVB = otherVs.b.addVectors(subSV);
                                const otherVC = otherVs.c.addVectors(subSV);
                                const otherVD = otherVs.d.addVectors(subSV);
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
                                    const selfVA = selfVs.a.addVectors(subOV);
                                    const selfVB = selfVs.b.addVectors(subOV);
                                    const selfVC = selfVs.c.addVectors(subOV);
                                    const selfVD = selfVs.d.addVectors(subOV);
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
            for (let key of Input.map.keys()) {
                let v = Input.map.get(key);
                if (v == 2) {
                    Input.map.set(key, 1);
                }
                else if (v == -1) {
                    Input.map.set(key, 0);
                }
            }
            if (Input.wheelFrame < Engine.currentFrame - 1) {
                Input.wheel = 0;
            }
        }
        static _onKeyDown(e) {
            Input.map.set(e.code, 2);
        }
        static _onKeyUp(e) {
            Input.map.set(e.code, -1);
        }
        static _onMouseMove(e) {
            Input.mousePosition = new Vector2(e.clientX, e.clientY);
        }
        static _onMouseDown(e) {
            switch (e.button) {
                case 0:
                    Input.map.set(Input._MOUSE_LEFT, 2);
                case 1:
                    Input.map.set(Input._MOUSE_MIDDLE, 2);
                case 2:
                    Input.map.set(Input._MOUSE_RIGHT, 2);
            }
        }
        static _onMouseUp(e) {
            switch (e.button) {
                case 0:
                    Input.map.set(Input._MOUSE_LEFT, -1);
                case 1:
                    Input.map.set(Input._MOUSE_MIDDLE, -1);
                case 2:
                    Input.map.set(Input._MOUSE_RIGHT, -1);
            }
        }
        static _onMouseWheel(e) {
            Input.wheelFrame = Engine.currentFrame;
            Input.wheel = e.deltaY;
        }
        static isUp(code) {
            if (Input.map.has(code)) {
                return Input.map.get(code) == -1;
            }
            return false;
        }
        static isNotPress(code) {
            const v = Input.map.get(code);
            return v == 0 || v == -1;
        }
        static isDown(code) {
            return Input.map.get(code) == 2;
        }
        static isPressing(code) {
            const v = Input.map.get(code);
            return v == 1 || v == 2;
        }
        static get isUpMouseLeft() {
            return Input.map.get(Input._MOUSE_LEFT) == -1;
        }
        static get isNotPressMouseLeft() {
            const v = Input.map.get(Input._MOUSE_LEFT);
            return v == -1 || v == 0;
        }
        static get isDownMouseLeft() {
            return Input.map.get(Input._MOUSE_LEFT) == 2;
        }
        static get isPressingMouseLeft() {
            const v = Input.map.get(Input._MOUSE_LEFT);
            return v == 1 || v == 2;
        }
        static get isUpMouseRight() {
            return Input.map.get(Input._MOUSE_RIGHT) == -1;
        }
        static get isNotPressMouseRight() {
            const v = Input.map.get(Input._MOUSE_RIGHT);
            return v == -1 || v == 0;
        }
        static get isDownMouseRight() {
            return Input.map.get(Input._MOUSE_RIGHT) == 2;
        }
        static get isPressingMouseRight() {
            const v = Input.map.get(Input._MOUSE_RIGHT);
            return v == 1 || v == 2;
        }
        static get isUpMouseMiddle() {
            return Input.map.get(Input._MOUSE_MIDDLE) == -1;
        }
        static get isNotPressMouseMiddle() {
            const v = Input.map.get(Input._MOUSE_MIDDLE);
            return v == -1 || v == 0;
        }
        static get isDownMouseMiddle() {
            return Input.map.get(Input._MOUSE_MIDDLE) == 2;
        }
        static get isPressingMouseMiddle() {
            const v = Input.map.get(Input._MOUSE_MIDDLE);
            return v == 1 || v == 2;
        }
    }
    Input._MOUSE_LEFT = "_MOUSE_LEFT";
    Input._MOUSE_RIGHT = "_MOUSE_RIGHT";
    Input._MOUSE_MIDDLE = "_MOUSE_MIDDLE";
    Input.map = new Map();
    Input.mousePosition = new Vector2(0, 0);
    Input.wheelFrame = 0;
    Input.wheel = 0;

    class Engine {
        static start() {
            Input.initialize();
            this.loop();
        }
        static loop() {
            Engine.currentFrame = Engine.currentFrame + 1;
            const now = window.performance.now();
            Engine.delta = (now - Engine.prevDate) / 1000;
            Engine.prevDate = now;
            MEntity.update();
            Input.update();
            requestAnimationFrame(Engine.loop);
        }
    }
    Engine.prevDate = window.performance.now();
    Engine.currentFrame = 0;
    Engine.delta = 0;

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
            e.position = e.position.addVectors(vecR.normalized.multiply(500).multiply(Engine.delta));
            if (e.isInBody == false) {
                e.remove();
            }
        }
    }

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
        update() {
            const player = Player.instance;
            const e = this.entity;
            if (player) {
                if (player.entity.isDestroy == false) {
                    this.entity.loopAtScreen(player.entity.positionScreen);
                    const vecR = e.right.addVectors(e.origin.multiply(-1));
                    e.position = e.position.addVectors(vecR.normalized.multiply(50).multiply(Engine.delta));
                }
            }
            const bulletAttr = MComponent.getAttributeName(Bullet);
            if (bulletAttr) {
                const bullet = e.collides.find(e => e.attributes.getNamedItem(bulletAttr));
                if (bullet) {
                    bullet.remove();
                    e.remove();
                }
            }
        }
    }
    Enemy.WIDTH = 100;
    Enemy.HEIGHT = 100;
    Enemy.generateNum = 1;

    class Gun extends MComponent {
        constructor() {
            super(...arguments);
            this.interval = 0;
        }
        update() {
            if (this.interval > 0) {
                this.interval -= Engine.delta;
            }
            if (Input.isPressingMouseLeft) {
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
        constructor() {
            super(...arguments);
            this.isReady = false;
        }
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
            const d = Engine.delta;
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
            if (Input.isDownMouseLeft) {
                this.isReady = true;
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
                e.remove();
            }
        }
    }
    Player.instance = undefined;

    /* src\app\App.svelte generated by Svelte v3.35.0 */

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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
    	validate_slots("App", slots, []);
    	let generateTime = 0;
    	let generateSpan = 3;

    	onMount(() => {
    		Engine.start();
    		MComponent.registerComponent("player", Player);
    		MComponent.registerComponent("gun", Gun);
    		MComponent.registerComponent("bullet", Bullet);
    		MComponent.registerComponent("enemy", Enemy);
    		Player.generate();
    		generateTime = generateSpan;
    		requestAnimationFrame(loop);
    	});

    	const loop = () => {
    		const player = Player.instance;

    		if (player && player.isReady) {
    			generateTime += Engine.delta;

    			if (generateTime > generateSpan) {
    				Enemy.generate();
    				generateTime = 0;
    				generateSpan = Math.max(generateSpan - 0.2, Gun.SPAN * 0.99);
    			}
    		}

    		requestAnimationFrame(loop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		MEntity,
    		Engine,
    		MComoponent: MComponent,
    		Player,
    		Gun,
    		Bullet,
    		Enemy,
    		generateTime,
    		generateSpan,
    		loop
    	});

    	$$self.$inject_state = $$props => {
    		if ("generateTime" in $$props) generateTime = $$props.generateTime;
    		if ("generateSpan" in $$props) generateSpan = $$props.generateSpan;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
