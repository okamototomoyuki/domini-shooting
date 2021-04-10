
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
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

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }

    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    /**
     * XYベクトル
     */
    class Vector2 {
        /**
         * コンストラクタ
         * @param x X
         * @param y Y
         */
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
        /**
         * 移動
         * @param v 移動ベクトル
         * @returns 結果のベクトル
         */
        addVectors(v) {
            return new Vector2(this.x + v.x, this.y + v.y);
        }
        /**
         * 掛け算
         * @param v 係数
         * @returns 結果のベクトル
         */
        multiply(v) {
            return new Vector2(this.x * v, this.y * v);
        }
        /**
         * 長さ
         * @returns 長さ
         */
        get distance() {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        }
        /**
         * 外積
         * @param va ベクトルa
         * @param vb ベクトルb
         * @returns 外積のベクトル
         */
        static cross(va, vb) {
            return va.x * vb.y - va.y * vb.x;
        }
        /**
         * XY座標線分が交わっているか
         * @param aFrom 線分A始点
         * @param aTo 線分A終点
         * @param bFrom 線分B始点
         * @param bTo 線分B終点
         * @returns true:交わっている
         */
        static isCrossXY(aFrom, aTo, bFrom, bTo) {
            const ta = (bFrom.x - bTo.x) * (aFrom.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aFrom.x);
            const tb = (bFrom.x - bTo.x) * (aTo.y - bFrom.y) + (bFrom.y - bTo.y) * (bFrom.x - aTo.x);
            const tc = (aFrom.x - aTo.x) * (bFrom.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bFrom.x);
            const td = (aFrom.x - aTo.x) * (bTo.y - aFrom.y) + (aFrom.y - aTo.y) * (aFrom.x - bTo.x);
            return tc * td < 0 && ta * tb < 0;
        }
    }

    /*
    * 矩形の頂点データ
    */
    class VertexData {
        /**
         * コンストラクタ
         * @param a 点1 左上
         * @param b 点2 右上
         * @param c 点3 右下
         * @param d 点4 左下
         */
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

    /**
     * 入力
     */
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
                if (v > 1) {
                    Input.map.set(key, 1);
                }
                else if (v < 0) {
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
            if (Input.map.has(code)) {
                return Input.map.get(code) <= 0;
            }
            return true;
        }
        static isDown(code) {
            if (Input.map.has(code)) {
                return Input.map.get(code) == 2;
            }
            return false;
        }
        static isPressing(code) {
            if (Input.map.has(code)) {
                return Input.map.get(code) > 0;
            }
            return false;
        }
        static get isUpMouseLeft() {
            if (Input.map.has(this._MOUSE_LEFT)) {
                return Input.map.get(this._MOUSE_LEFT) == -1;
            }
            return false;
        }
        static get isNotPressMouseLeft() {
            if (Input.map.has(this._MOUSE_LEFT)) {
                return Input.map.get(this._MOUSE_LEFT) <= 0;
            }
            return true;
        }
        static get isDownMouseLeft() {
            if (Input.map.has(this._MOUSE_LEFT)) {
                return Input.map.get(this._MOUSE_LEFT) == 2;
            }
            return false;
        }
        static get isPressingMouseLeft() {
            if (Input.map.has(this._MOUSE_LEFT)) {
                return Input.map.get(this._MOUSE_LEFT) > 0;
            }
            return false;
        }
        static get isUpMouseRight() {
            if (Input.map.has(this._MOUSE_RIGHT)) {
                return Input.map.get(this._MOUSE_RIGHT) == -1;
            }
            return false;
        }
        static get isNotPressMouseRight() {
            if (Input.map.has(this._MOUSE_RIGHT)) {
                return Input.map.get(this._MOUSE_RIGHT) <= 0;
            }
            return true;
        }
        static get isDownMouseRight() {
            if (Input.map.has(this._MOUSE_RIGHT)) {
                return Input.map.get(this._MOUSE_RIGHT) == 2;
            }
            return false;
        }
        static get isPressingMouseRight() {
            if (Input.map.has(this._MOUSE_RIGHT)) {
                return Input.map.get(this._MOUSE_RIGHT) > 0;
            }
            return false;
        }
        static get isUpMouseMiddle() {
            if (Input.map.has(this._MOUSE_MIDDLE)) {
                return Input.map.get(this._MOUSE_MIDDLE) == -1;
            }
            return false;
        }
        static get isNotPressMouseMiddle() {
            if (Input.map.has(this._MOUSE_MIDDLE)) {
                return Input.map.get(this._MOUSE_MIDDLE) <= 0;
            }
            return true;
        }
        static get isDownMouseMiddle() {
            if (Input.map.has(this._MOUSE_MIDDLE)) {
                return Input.map.get(this._MOUSE_MIDDLE) == 2;
            }
            return false;
        }
        static get isPressingMouseMiddle() {
            if (Input.map.has(this._MOUSE_MIDDLE)) {
                return Input.map.get(this._MOUSE_MIDDLE) > 0;
            }
            return false;
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
            Transform.initialize();
            this.loop();
        }
        static loop() {
            Engine.currentFrame = Engine.currentFrame + 1;
            const now = window.performance.now();
            Engine.delta = (now - Engine.prevDate) / 1000;
            Engine.prevDate = now;
            Input.update();
            Transform.update();
            requestAnimationFrame(Engine.loop);
        }
    }
    Engine.prevDate = window.performance.now();
    Engine.currentFrame = 0;
    Engine.delta = 0;

    class Vertex {
        constructor(trans, type) {
            this.trans = trans;
            const node = document.createElement('div');
            this.node = node;
            this.type = type;
            this.trans.node.appendChild(this.node);
            node.style.position = "absolute";
            node.style.transformOrigin = "center";
            node.style.opacity = "0";
            node.style.width = "0px";
            node.style.height = "0px";
            this.rebuild();
        }
        rebuild() {
            switch (this.type) {
                case Vertex.TYPE_ORIGIN:
                    this.node.style.transform = `translate(${this.trans.node.offsetWidth / 2}px, ${this.trans.node.offsetHeight / 2}px)`;
                    break;
                case Vertex.TYPE_LT:
                    this.node.style.transform = "translate(0px, 0px)";
                    break;
                case Vertex.TYPE_RT:
                    this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, 0px)`;
                    break;
                case Vertex.TYPE_RB:
                    this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, ${this.trans.node.offsetHeight}px)`;
                    break;
                case Vertex.TYPE_LB:
                    this.node.style.transform = `translate(0px, ${this.trans.node.offsetHeight}px)`;
                    break;
                case Vertex.TYPE_TOP:
                    this.node.style.transform = `translate(${this.trans.node.offsetWidth / 2}px, 0px)`;
                    break;
                case Vertex.TYPE_RIGHT:
                    this.node.style.transform = `translate(${this.trans.node.offsetWidth}px, ${this.trans.node.offsetHeight / 2}px)`;
                    break;
                case Vertex.TYPE_BOTTOM:
                    this.node.style.transform = `translate(${this.trans.node.offsetWidth / 2}px, ${this.trans.node.offsetHeight}px)`;
                    break;
                case Vertex.TYPE_LEFT:
                    this.node.style.transform = `translate(0px, ${this.trans.node.offsetHeight / 2}px)`;
                    break;
            }
        }
        get positionScreen() {
            let bound = this.node.getBoundingClientRect();
            return new Vector2(bound.x, bound.y);
        }
    }
    Vertex.TYPE_ORIGIN = 0;
    Vertex.TYPE_LT = 1;
    Vertex.TYPE_RT = 2;
    Vertex.TYPE_RB = 3;
    Vertex.TYPE_LB = 4;
    Vertex.TYPE_TOP = 5;
    Vertex.TYPE_RIGHT = 6;
    Vertex.TYPE_BOTTOM = 7;
    Vertex.TYPE_LEFT = 8;
    Vertex.nodeToIns = new Map();

    var _x, _y, _r, _sx, _sy, _w, _h;
    /**
     * 矩形の Transform
     */
    class Transform {
        constructor(node) {
            _x.set(this, 0);
            _y.set(this, 0);
            _r.set(this, 0);
            _sx.set(this, 1);
            _sy.set(this, 1);
            _w.set(this, 100);
            _h.set(this, 100);
            this.frame = 0;
            this.isDirty = false;
            this.node = node;
            this.vertices = [
                new Vertex(this, Vertex.TYPE_ORIGIN),
                new Vertex(this, Vertex.TYPE_LT),
                new Vertex(this, Vertex.TYPE_RT),
                new Vertex(this, Vertex.TYPE_RB),
                new Vertex(this, Vertex.TYPE_LB),
                new Vertex(this, Vertex.TYPE_TOP),
                new Vertex(this, Vertex.TYPE_RIGHT),
                new Vertex(this, Vertex.TYPE_BOTTOM),
                new Vertex(this, Vertex.TYPE_LEFT),
            ];
        }
        static initialize() {
            this.update();
        }
        static update() {
            for (const e of Transform.nodeToIns.values()) {
                e.patch();
            }
        }
        static getTransform(node) {
            this.initialize();
            let t = Transform.nodeToIns.get(node);
            if (t != null) {
                return t;
            }
            else {
                t = new Transform(node);
                Transform.nodeToIns.set(node, t);
                return t;
            }
        }
        rebuildMatrix() {
            if (this.frame != Engine.currentFrame) {
                // const computedStyle = getComputedStyle(this.node, null);
                // this.matrix = Matrix.fromString(computedStyle.transform);
                var style = this.node.style;
                const x = style.getPropertyValue("--x");
                const y = style.getPropertyValue("--y");
                const r = style.getPropertyValue("--r");
                const sx = style.getPropertyValue("--sx");
                const sy = style.getPropertyValue("--sy");
                const w = style.getPropertyValue("--w");
                const h = style.getPropertyValue("--h");
                __classPrivateFieldSet(this, _x, x ? Number(x.replace("px", "")) : __classPrivateFieldGet(this, _x));
                __classPrivateFieldSet(this, _y, y ? Number(y.replace("px", "")) : __classPrivateFieldGet(this, _y));
                __classPrivateFieldSet(this, _r, r ? Number(r.replace("deg", "")) : __classPrivateFieldGet(this, _r));
                __classPrivateFieldSet(this, _sx, sx ? Number(sx) : __classPrivateFieldGet(this, _sx));
                __classPrivateFieldSet(this, _sy, sy ? Number(sy) : __classPrivateFieldGet(this, _sy));
                __classPrivateFieldSet(this, _w, w ? Number(w.replace("px", "")) : __classPrivateFieldGet(this, _w));
                __classPrivateFieldSet(this, _h, h ? Number(h.replace("px", "")) : __classPrivateFieldGet(this, _h));
                this.frame = Engine.currentFrame;
            }
        }
        get x() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _x);
        }
        set x(x) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _x, x);
            this.isDirty = true;
        }
        get y() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _y);
        }
        set y(y) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _y, y);
            this.isDirty = true;
        }
        get r() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _r);
        }
        set r(r) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _r, r);
            this.isDirty = true;
        }
        get sx() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _sx);
        }
        set sx(sx) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _sx, sx);
            this.isDirty = true;
        }
        get sy() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _sy);
        }
        set sy(sy) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _sy, sy);
            this.isDirty = true;
        }
        get w() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _w);
        }
        set w(w) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _w, w);
            this.isDirty = true;
        }
        get h() {
            this.rebuildMatrix();
            return __classPrivateFieldGet(this, _h);
        }
        set h(h) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _h, h);
            this.isDirty = true;
        }
        get position() {
            this.rebuildMatrix();
            return new Vector2(__classPrivateFieldGet(this, _x), __classPrivateFieldGet(this, _y));
        }
        set position(v) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _x, v.x);
            __classPrivateFieldSet(this, _y, v.y);
            this.isDirty = true;
        }
        setPosition(x, y) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _x, x);
            __classPrivateFieldSet(this, _y, y);
            this.isDirty = true;
        }
        get scale() {
            this.rebuildMatrix();
            return new Vector2(__classPrivateFieldGet(this, _sx), __classPrivateFieldGet(this, _sy));
        }
        set scale(v) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _sx, v.x);
            __classPrivateFieldSet(this, _sy, v.y);
            this.isDirty = true;
        }
        setScale(sx, sy) {
            this.rebuildMatrix();
            __classPrivateFieldSet(this, _sx, sx);
            __classPrivateFieldSet(this, _sy, sy);
            this.isDirty = true;
        }
        get positionScreen() {
            return this.vertices[Vertex.TYPE_ORIGIN].positionScreen;
        }
        get rotateScreen() {
            const vec = this.vertices[Vertex.TYPE_RIGHT].positionScreen.addVectors(this.vertices[Vertex.TYPE_ORIGIN].positionScreen.multiply(-1));
            return Math.atan2(vec.y, vec.x);
        }
        get scaleScreenX() {
            const vec = this.vertices[Vertex.TYPE_RIGHT].positionScreen.addVectors(this.vertices[Vertex.TYPE_LEFT].positionScreen.multiply(-1));
            return vec.distance / this.node.offsetWidth;
        }
        get scaleScreenY() {
            const vec = this.vertices[Vertex.TYPE_BOTTOM].positionScreen.addVectors(this.vertices[Vertex.TYPE_TOP].positionScreen.multiply(-1));
            return vec.distance / this.node.offsetHeight;
        }
        /**
         * ローカル座標X移動
         * @param dx X座標
         */
        translateX(dx) {
            this.x += dx;
        }
        /**
         * ローカル座標Y移動
         * @param dy Y座標
         */
        translateY(dy) {
            this.y += this.y + dy;
        }
        /**
         * 座標移動
         * @param dx X座標
         * @param dy Y座標
         */
        translate(dx, dy) {
            this.setPosition(this.x + dx, this.y + dy);
        }
        /**
         * 回転
         * @param angle ラジアン
         */
        addRotate(angle) {
            this.r = this.r + angle;
        }
        degToRad(d) {
            return d * (Math.PI / 180);
        }
        /**
         * スクリーン座標X移動
         * @param x X座標
         */
        translateScreenX(x) {
            this.rebuildMatrix();
            let rad = this.degToRad(this.rotateScreen);
            this.x += x * Math.cos(-rad) * this.scaleScreenX;
            this.y += x * Math.sin(-rad) * this.scaleScreenY;
            this.isDirty = true;
        }
        /**
         * スクリーン座標Y移動
         * @param y Y座標
         */
        translateScreenY(y) {
            this.rebuildMatrix();
            let rad = this.degToRad(this.rotateScreen);
            this.x += -y * Math.cos(-(rad + Math.PI / 2)) * this.scaleScreenX;
            this.y += -y * Math.sin(-(rad + Math.PI / 2)) * this.scaleScreenY;
            this.isDirty = true;
        }
        /**
         * スクリーン座標X移動
         * @param x X座標
         * @param y y座標
         */
        translateScreen(x, y) {
            this.rebuildMatrix();
            let rad = this.degToRad(this.rotateScreen);
            this.x += x * Math.cos(-rad) - y * Math.cos(-(rad + Math.PI / 2)) * this.scaleScreenX;
            this.y += x * Math.sin(-rad) - y * Math.sin(-(rad + Math.PI / 2)) * this.scaleScreenY;
            this.isDirty = true;
        }
        /**
         * 画面に対しての頂点データ計算
         * @returns 頂点データ
         */
        computeVertexScreen() {
            return new VertexData(this.vertices[Vertex.TYPE_LT].positionScreen, this.vertices[Vertex.TYPE_RT].positionScreen, this.vertices[Vertex.TYPE_RB].positionScreen, this.vertices[Vertex.TYPE_LB].positionScreen);
        }
        ;
        /**
         * 親ノード取得
         */
        get parentNode() {
            return this.node.parentNode;
        }
        /**
         * 衝突した対象一覧
         */
        get collides() {
            const selfVs = this.computeVertexScreen();
            const oVecs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];
            const collides = new Array();
            for (const otherT of Transform.nodeToIns.values()) {
                if (otherT != this) {
                    const otherVs = otherT.computeVertexScreen();
                    // 線分が交わっているか
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
                    else {
                        // 点が矩形内に入っているか
                        for (const oVec of oVecs) {
                            const otherVA = otherVs.a.addVectors(oVec);
                            const otherVB = otherVs.b.addVectors(oVec);
                            const otherVC = otherVs.c.addVectors(oVec);
                            const otherVD = otherVs.d.addVectors(oVec);
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
                    if (isCollide) {
                        collides.push(otherT);
                    }
                }
            }
            return collides;
        }
        loopAtScreen(targetPos) {
            const targetVec = targetPos.addVectors(this.vertices[Vertex.TYPE_ORIGIN].positionScreen.multiply(-1));
            const targetRad = Math.atan2(targetVec.y, targetVec.x);
            const baseVec = this.vertices[Vertex.TYPE_RIGHT].positionScreen.addVectors(this.vertices[Vertex.TYPE_ORIGIN].positionScreen.multiply(-1));
            const baseRad = Math.atan2(baseVec.y, baseVec.x);
            this.addRotate((targetRad - baseRad) / (Math.PI / 180));
        }
        /**
         * 更新された情報で変形反映
         */
        patch() {
            if (this.isDirty) {
                // this.node.setAttribute("style", `transform: ${this.matrix.toString()}`);
                var style = this.node.style;
                style.setProperty("--x", `${__classPrivateFieldGet(this, _x)}px`);
                style.setProperty("--y", `${__classPrivateFieldGet(this, _y)}px`);
                style.setProperty("--r", `${__classPrivateFieldGet(this, _r)}deg`);
                style.setProperty("--sx", String(__classPrivateFieldGet(this, _sx)));
                style.setProperty("--sy", String(__classPrivateFieldGet(this, _sy)));
                style.setProperty("--w", `${__classPrivateFieldGet(this, _w)}px`);
                style.setProperty("--h", `${__classPrivateFieldGet(this, _h)}px`);
            }
            this.isDirty = false;
        }
    }
    _x = new WeakMap(), _y = new WeakMap(), _r = new WeakMap(), _sx = new WeakMap(), _sy = new WeakMap(), _w = new WeakMap(), _h = new WeakMap();
    Transform.nodeToIns = new Map();

    /* src\App.svelte generated by Svelte v3.35.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div2;
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "svelte-tpimf0");
    			add_location(div0, file, 80, 2, 2123);
    			attr_dev(div1, "class", "svelte-tpimf0");
    			add_location(div1, file, 79, 1, 2097);
    			set_style(div2, "--w", "320px");
    			set_style(div2, "--h", "256px");
    			attr_dev(div2, "class", "svelte-tpimf0");
    			toggle_class(div2, "collision", /*isCollision*/ ctx[3]);
    			add_location(div2, file, 74, 0, 2010);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[4](div0);
    			/*div1_binding*/ ctx[5](div1);
    			/*div2_binding*/ ctx[6](div2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isCollision*/ 8) {
    				toggle_class(div2, "collision", /*isCollision*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			/*div0_binding*/ ctx[4](null);
    			/*div1_binding*/ ctx[5](null);
    			/*div2_binding*/ ctx[6](null);
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
    	let rect;
    	let rect2;
    	let rect3;
    	let isCollision = false;

    	onMount(() => {
    		Engine.start();
    		const t2 = Transform.getTransform(rect2);
    		const t3 = Transform.getTransform(rect3);
    		t2.translateX(330);
    		t3.translateX(330);
    		loop();
    	});

    	const loop = () => {
    		const t1 = Transform.getTransform(rect);
    		const t2 = Transform.getTransform(rect2);
    		const t3 = Transform.getTransform(rect3);
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
    			t1.addRotate(-d * 100);
    		}

    		if (Input.isPressing("KeyE")) {
    			t1.addRotate(d * 100);
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
    			t2.addRotate(-d * 100);
    		}

    		if (Input.isPressing("KeyO")) {
    			t2.addRotate(d * 100);
    		}

    		if (Input.isPressing("KeyP")) {
    			t3.addRotate(-d * 100);
    		}

    		if (Input.isPressing("BracketLeft")) {
    			t3.addRotate(d * 100);
    		}

    		// t1.loopAtScreen(Input.mousePosition);
    		$$invalidate(3, isCollision = false);

    		for (let e of t1.collides) {
    			if (e.node == t3.node) {
    				$$invalidate(3, isCollision = true);
    			}
    		}

    		requestAnimationFrame(loop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rect3 = $$value;
    			$$invalidate(2, rect3);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rect2 = $$value;
    			$$invalidate(1, rect2);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rect = $$value;
    			$$invalidate(0, rect);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Transform,
    		Input,
    		Engine,
    		rect,
    		rect2,
    		rect3,
    		isCollision,
    		loop
    	});

    	$$self.$inject_state = $$props => {
    		if ("rect" in $$props) $$invalidate(0, rect = $$props.rect);
    		if ("rect2" in $$props) $$invalidate(1, rect2 = $$props.rect2);
    		if ("rect3" in $$props) $$invalidate(2, rect3 = $$props.rect3);
    		if ("isCollision" in $$props) $$invalidate(3, isCollision = $$props.isCollision);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rect, rect2, rect3, isCollision, div0_binding, div1_binding, div2_binding];
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
