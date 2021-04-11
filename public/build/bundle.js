
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
        get distance() {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
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
            this.isInit = false;
            this.vertices = [];
        }
        connectedCallback() {
            if (this.isInit == false) {
                this.isInit = true;
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
                if (style.getPropertyValue("--r") == "") {
                    this.r = 0;
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
                MEntity.list.push(this);
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
        get r() {
            const r = this.style.getPropertyValue("--r");
            return r ? Number(r.replace("deg", "")) : 0;
        }
        set r(r) {
            this.style.setProperty("--r", `${r}deg`);
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
        get origin() {
            return this.vertices[Vertex.TYPE_LT].positionScreen.addVectors(this.vertices[Vertex.TYPE_LT].positionScreen).multiply(0.5);
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
        get rotateScreen() {
            const vec = this.right.addVectors(this.origin.multiply(-1));
            return Math.atan2(vec.y, vec.x);
        }
        get scaleScreenX() {
            const vec = this.right.addVectors(this.left.multiply(-1));
            return vec.distance / this.offsetWidth;
        }
        get scaleScreenY() {
            const vec = this.bottom.addVectors(this.top.multiply(-1));
            return vec.distance / this.offsetHeight;
        }
        degToRad(deg) {
            return deg * (Math.PI / 180);
        }
        radToDeg(rad) {
            return rad / (Math.PI / 180);
        }
        translateScreenX(x) {
            let rad = this.degToRad(this.rotateScreen);
            this.x += x * Math.cos(-rad) * this.scaleScreenX;
            this.y += x * Math.sin(-rad) * this.scaleScreenY;
        }
        translateScreenY(y) {
            let rad = this.degToRad(this.rotateScreen);
            this.x += -y * Math.cos(-(rad + Math.PI / 2)) * this.scaleScreenX;
            this.y += -y * Math.sin(-(rad + Math.PI / 2)) * this.scaleScreenY;
        }
        translateScreen(x, y) {
            let rad = this.degToRad(this.rotateScreen);
            this.x += x * Math.cos(-rad) - y * Math.cos(-(rad + Math.PI / 2)) * this.scaleScreenX;
            this.y += x * Math.sin(-rad) - y * Math.sin(-(rad + Math.PI / 2)) * this.scaleScreenY;
        }
        computeVertexScreen() {
            return new VertexData(this.vertices[Vertex.TYPE_LT].positionScreen, this.vertices[Vertex.TYPE_RT].positionScreen, this.vertices[Vertex.TYPE_RB].positionScreen, this.vertices[Vertex.TYPE_LB].positionScreen);
        }
        ;
        get parentNode() {
            return this.parentNode;
        }
        get collides() {
            const selfVs = this.computeVertexScreen();
            const subSVs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];
            const collides = new Array();
            for (const otherT of MEntity.list) {
                if (otherT != this) {
                    const otherVs = otherT.computeVertexScreen();
                    const subOVs = [otherVs.a.multiply(-1), otherVs.b.multiply(-1), otherVs.c.multiply(-1), otherVs.d.multiply(-1)];
                    let isCollide = false;
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
                    if (isCollide == false) {
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
                    if (isCollide) {
                        collides.push(otherT);
                    }
                }
            }
            return collides;
        }
        loopAtScreen(targetPos) {
            const targetVec = targetPos.addVectors(this.origin.multiply(-1));
            const targetRad = Math.atan2(targetVec.y, targetVec.x);
            const baseVec = this.right.addVectors(this.origin.multiply(-1));
            const baseRad = Math.atan2(baseVec.y, baseVec.x);
            this.r += this.radToDeg(targetRad - baseRad);
        }
    }
    MEntity.list = new Array();
    customElements.define("m-entity", MEntity);

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
            Input.update();
            requestAnimationFrame(Engine.loop);
        }
    }
    Engine.prevDate = window.performance.now();
    Engine.currentFrame = 0;
    Engine.delta = 0;

    class Input {
        static initialize() {
            document.addEventListener("keydown", this._onKeyDown);
            document.addEventListener("keyup", this._onKeyUp);
            document.addEventListener("mousemove", this._onMouseMove);
            document.body.addEventListener("mousedown", this._onMouseDown);
            document.body.addEventListener("mouseup", this._onMouseUp);
            document.body.addEventListener("wheel", this._onMouseWheel);
            this.update();
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
                    Input.map.set(this._MOUSE_LEFT, 2);
                case 1:
                    Input.map.set(this._MOUSE_MIDDLE, 2);
                case 2:
                    Input.map.set(this._MOUSE_RIGHT, 2);
            }
        }
        static _onMouseUp(e) {
            switch (e.button) {
                case 0:
                    Input.map.set(this._MOUSE_LEFT, -1);
                case 1:
                    Input.map.set(this._MOUSE_MIDDLE, -1);
                case 2:
                    Input.map.set(this._MOUSE_RIGHT, -1);
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
            return Input.map.get(this._MOUSE_LEFT) == -1;
        }
        static get isNotPressMouseLeft() {
            const v = Input.map.get(this._MOUSE_LEFT);
            return v == -1 || v == 0;
        }
        static get isDownMouseLeft() {
            return Input.map.get(this._MOUSE_LEFT) == 2;
        }
        static get isPressingMouseLeft() {
            const v = Input.map.get(this._MOUSE_LEFT);
            return v == 1 || v == 2;
        }
        static get isUpMouseRight() {
            return Input.map.get(this._MOUSE_RIGHT) == -1;
        }
        static get isNotPressMouseRight() {
            const v = Input.map.get(this._MOUSE_RIGHT);
            return v == -1 || v == 0;
        }
        static get isDownMouseRight() {
            return Input.map.get(this._MOUSE_RIGHT) == 2;
        }
        static get isPressingMouseRight() {
            const v = Input.map.get(this._MOUSE_RIGHT);
            return v == 1 || v == 2;
        }
        static get isUpMouseMiddle() {
            return Input.map.get(this._MOUSE_MIDDLE) == -1;
        }
        static get isNotPressMouseMiddle() {
            const v = Input.map.get(this._MOUSE_MIDDLE);
            return v == -1 || v == 0;
        }
        static get isDownMouseMiddle() {
            return Input.map.get(this._MOUSE_MIDDLE) == 2;
        }
        static get isPressingMouseMiddle() {
            const v = Input.map.get(this._MOUSE_MIDDLE);
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

    /* src\app\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\app\\App.svelte";

    function create_fragment(ctx) {
    	let m_entity2;
    	let m_entity1;
    	let m_entity0;

    	const block = {
    		c: function create() {
    			m_entity2 = element("m-entity");
    			m_entity1 = element("m-entity");
    			m_entity0 = element("m-entity");
    			set_custom_element_data(m_entity0, "class", "c svelte-ykoydo");
    			add_location(m_entity0, file, 82, 2, 1988);
    			set_custom_element_data(m_entity1, "class", "b svelte-ykoydo");
    			add_location(m_entity1, file, 81, 1, 1950);
    			set_custom_element_data(m_entity2, "class", "a svelte-ykoydo");
    			set_style(m_entity2, "--w", "320px");
    			set_style(m_entity2, "--h", "256px");
    			toggle_class(m_entity2, "collision", /*isCollision*/ ctx[3]);
    			add_location(m_entity2, file, 75, 0, 1849);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, m_entity2, anchor);
    			append_dev(m_entity2, m_entity1);
    			append_dev(m_entity1, m_entity0);
    			/*m_entity0_binding*/ ctx[4](m_entity0);
    			/*m_entity1_binding*/ ctx[5](m_entity1);
    			/*m_entity2_binding*/ ctx[6](m_entity2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isCollision*/ 8) {
    				toggle_class(m_entity2, "collision", /*isCollision*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(m_entity2);
    			/*m_entity0_binding*/ ctx[4](null);
    			/*m_entity1_binding*/ ctx[5](null);
    			/*m_entity2_binding*/ ctx[6](null);
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
    	validate_slots("App", slots, []);
    	let t1;
    	let t2;
    	let t3;
    	let isCollision = false;

    	onMount(() => {
    		Engine.start();
    		$$invalidate(1, t2.x += 330, t2);
    		$$invalidate(2, t3.x += 330, t3);
    		loop();
    	});

    	const loop = () => {
    		const d = Engine.delta;

    		if (Input.isPressing("KeyW")) {
    			t1.translateScreenY(-d * 100);
    		}

    		if (Input.isPressing("KeyA")) {
    			t1.translateScreenX(-d * 100);
    		}

    		if (Input.isPressing("KeyS")) {
    			t1.translateScreenY(d * 100);
    		}

    		if (Input.isPressing("KeyD")) {
    			t1.translateScreenX(d * 100);
    		}

    		if (Input.isPressing("KeyQ")) {
    			$$invalidate(0, t1.r += -d * 100, t1);
    		}

    		if (Input.isPressing("KeyE")) {
    			$$invalidate(0, t1.r += d * 100, t1);
    		}

    		if (Input.isPressing("KeyZ")) {
    			$$invalidate(0, t1.sx -= d * 10, t1);
    		}

    		if (Input.isPressing("KeyC")) {
    			$$invalidate(0, t1.sy -= d * 10, t1);
    		}

    		if (Input.isPressing("KeyI")) {
    			t2.translateScreenY(-d * 100);
    		}

    		if (Input.isPressing("KeyJ")) {
    			t2.translateScreenX(-d * 100);
    		}

    		if (Input.isPressing("KeyK")) {
    			t2.translateScreenY(d * 100);
    		}

    		if (Input.isPressing("KeyL")) {
    			t2.translateScreenX(d * 100);
    		}

    		if (Input.isPressing("KeyU")) {
    			$$invalidate(1, t2.r += -d * 100, t2);
    		}

    		if (Input.isPressing("KeyO")) {
    			$$invalidate(1, t2.r += d * 100, t2);
    		}

    		if (Input.isPressing("KeyP")) {
    			$$invalidate(2, t3.r += -d * 100, t3);
    		}

    		if (Input.isPressing("BracketLeft")) {
    			$$invalidate(2, t3.r += d * 100, t3);
    		}

    		t2.loopAtScreen(Input.mousePosition);
    		$$invalidate(3, isCollision = false);

    		for (let e of t1.collides) {
    			if (e == t3) {
    				$$invalidate(3, isCollision = true);
    			}
    		}

    		requestAnimationFrame(loop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function m_entity0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			t3 = $$value;
    			$$invalidate(2, t3);
    		});
    	}

    	function m_entity1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			t2 = $$value;
    			$$invalidate(1, t2);
    		});
    	}

    	function m_entity2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			t1 = $$value;
    			$$invalidate(0, t1);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		MEntity,
    		Input,
    		Engine,
    		t1,
    		t2,
    		t3,
    		isCollision,
    		loop
    	});

    	$$self.$inject_state = $$props => {
    		if ("t1" in $$props) $$invalidate(0, t1 = $$props.t1);
    		if ("t2" in $$props) $$invalidate(1, t2 = $$props.t2);
    		if ("t3" in $$props) $$invalidate(2, t3 = $$props.t3);
    		if ("isCollision" in $$props) $$invalidate(3, isCollision = $$props.isCollision);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		t1,
    		t2,
    		t3,
    		isCollision,
    		m_entity0_binding,
    		m_entity1_binding,
    		m_entity2_binding
    	];
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
