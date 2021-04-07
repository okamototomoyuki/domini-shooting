
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

    /**
     * XYZベクトル
     */
    class Vector3 {
        /**
         * コンストラクタ
         * @param x X
         * @param y Y
         * @param z Z
         */
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        /**
         * 移動
         * @param v 移動ベクトル
         * @returns 結果のベクトル
         */
        addVectors(v) {
            return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
        }
        /**
         * 掛け算
         * @param v 係数
         * @returns 結果のベクトル
         */
        multiply(v) {
            return new Vector3(this.x * v, this.y * v, this.z * v);
        }
        /**
         * 回転
         * @param v 回転ベクトル
         * @returns 結果のベクトル
         */
        rotateVector(v) {
            let x1 = this.x;
            let y1 = this.y;
            let z1 = this.z;
            let angleX = v.x / 2;
            let angleY = v.y / 2;
            let angleZ = v.z / 2;
            let cr = Math.cos(angleX);
            let cp = Math.cos(angleY);
            let cy = Math.cos(angleZ);
            let sr = Math.sin(angleX);
            let sp = Math.sin(angleY);
            let sy = Math.sin(angleZ);
            let w = cr * cp * cy + -sr * sp * -sy;
            let x = sr * cp * cy - -cr * sp * -sy;
            let y = cr * sp * cy + sr * cp * sy;
            let z = cr * cp * sy - -sr * sp * -cy;
            let m0 = 1 - 2 * (y * y + z * z);
            let m1 = 2 * (x * y + z * w);
            let m2 = 2 * (x * z - y * w);
            let m4 = 2 * (x * y - z * w);
            let m5 = 1 - 2 * (x * x + z * z);
            let m6 = 2 * (z * y + x * w);
            let m8 = 2 * (x * z + y * w);
            let m9 = 2 * (y * z - x * w);
            let m10 = 1 - 2 * (x * x + y * y);
            return new Vector3(x1 * m0 + y1 * m4 + z1 * m8, x1 * m1 + y1 * m5 + z1 * m9, x1 * m2 + y1 * m6 + z1 * m10);
        }
        /**
         * 長さ
         * @returns 長さ
         */
        length() {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
        }
        /**
         * 外積
         * @param va ベクトルa
         * @param vb ベクトルb
         * @returns 外積のベクトル
         */
        static cross(va, vb) {
            return new Vector3(va.y * vb.z - va.z * vb.y, va.z * vb.x - va.x * vb.z, va.x * vb.y - va.y * vb.x);
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

    /**
     * 4x4行列
     */
    class Matrix extends Array {
        static format(source) {
            if (source && source.constructor === Array) {
                const values = source
                    .filter(function (value) { return typeof value === 'number'; })
                    .filter(function (value) { return !isNaN(value); });
                if (source.length === 6 && values.length === 6) {
                    const matrix = this.identity();
                    matrix.r0c0 = values[0];
                    matrix.r0c1 = values[1];
                    matrix.r1c0 = values[2];
                    matrix.r1c1 = values[3];
                    matrix.r3c0 = values[4];
                    matrix.r3c1 = values[5];
                    return matrix;
                }
                else if (source.length === 16 && values.length === 16) {
                    return this.fromArray(values);
                }
            }
            throw new TypeError('Expected a `number[]` with length 6 or 16.');
        }
        static fromArray(array) {
            const m = new Matrix();
            array && Object.assign(m, array);
            return m;
        }
        static fromString(source) {
            if (typeof source === 'string') {
                var match = source.match(/matrix(3d)?\(([^)]+)\)/);
                if (match) {
                    var raw = match[2].split(',').map(parseFloat);
                    return this.format(raw);
                }
                if (source === 'none' || source === '') {
                    return this.identity();
                }
            }
            throw new TypeError('Expected a string containing `matrix()` or `matrix3d()');
        }
        static identity() {
            const matrix = [];
            for (var i = 0; i < 16; i++) {
                i % 5 == 0 ? matrix.push(1) : matrix.push(0);
            }
            return Matrix.format(matrix);
        }
        get r0c0() { return this[0]; }
        get r0c1() { return this[1]; }
        get r0c2() { return this[2]; }
        get r0c3() { return this[3]; }
        get r1c0() { return this[4]; }
        get r1c1() { return this[5]; }
        get r1c2() { return this[6]; }
        get r1c3() { return this[7]; }
        get r2c0() { return this[8]; }
        get r2c1() { return this[9]; }
        get r2c2() { return this[10]; }
        get r2c3() { return this[11]; }
        get r3c0() { return this[12]; }
        get r3c1() { return this[13]; }
        get r3c2() { return this[14]; }
        get r3c3() { return this[15]; }
        set r0c0(v) { this[0] = v; }
        set r0c1(v) { this[1] = v; }
        set r0c2(v) { this[2] = v; }
        set r0c3(v) { this[3] = v; }
        set r1c0(v) { this[4] = v; }
        set r1c1(v) { this[5] = v; }
        set r1c2(v) { this[6] = v; }
        set r1c3(v) { this[7] = v; }
        set r2c0(v) { this[8] = v; }
        set r2c1(v) { this[9] = v; }
        set r2c2(v) { this[10] = v; }
        set r2c3(v) { this[11] = v; }
        set r3c0(v) { this[12] = v; }
        set r3c1(v) { this[13] = v; }
        set r3c2(v) { this[14] = v; }
        set r3c3(v) { this[15] = v; }
        inverse() {
            const m = this;
            const s0 = m.r0c0 * m.r1c1 - m.r1c0 * m.r0c1;
            const s1 = m.r0c0 * m.r1c2 - m.r1c0 * m.r0c2;
            const s2 = m.r0c0 * m.r1c3 - m.r1c0 * m.r0c3;
            const s3 = m.r0c1 * m.r1c2 - m.r1c1 * m.r0c2;
            const s4 = m.r0c1 * m.r1c3 - m.r1c1 * m.r0c3;
            const s5 = m.r0c2 * m.r1c3 - m.r1c2 * m.r0c3;
            const c5 = m.r2c2 * m.r3c3 - m.r3c2 * m.r2c3;
            const c4 = m.r2c1 * m.r3c3 - m.r3c1 * m.r2c3;
            const c3 = m.r2c1 * m.r3c2 - m.r3c1 * m.r2c2;
            const c2 = m.r2c0 * m.r3c3 - m.r3c0 * m.r2c3;
            const c1 = m.r2c0 * m.r3c2 - m.r3c0 * m.r2c2;
            const c0 = m.r2c0 * m.r3c1 - m.r3c0 * m.r2c1;
            const determinant = 1 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);
            if (isNaN(determinant) || determinant === Infinity) {
                throw new Error('Inverse determinant attempted to divide by zero.');
            }
            return Matrix.format([
                (m.r1c1 * c5 - m.r1c2 * c4 + m.r1c3 * c3) * determinant,
                (-m.r0c1 * c5 + m.r0c2 * c4 - m.r0c3 * c3) * determinant,
                (m.r3c1 * s5 - m.r3c2 * s4 + m.r3c3 * s3) * determinant,
                (-m.r2c1 * s5 + m.r2c2 * s4 - m.r2c3 * s3) * determinant,
                (-m.r1c0 * c5 + m.r1c2 * c2 - m.r1c3 * c1) * determinant,
                (m.r0c0 * c5 - m.r0c2 * c2 + m.r0c3 * c1) * determinant,
                (-m.r3c0 * s5 + m.r3c2 * s2 - m.r3c3 * s1) * determinant,
                (m.r2c0 * s5 - m.r2c2 * s2 + m.r2c3 * s1) * determinant,
                (m.r1c0 * c4 - m.r1c1 * c2 + m.r1c3 * c0) * determinant,
                (-m.r0c0 * c4 + m.r0c1 * c2 - m.r0c3 * c0) * determinant,
                (m.r3c0 * s4 - m.r3c1 * s2 + m.r3c3 * s0) * determinant,
                (-m.r2c0 * s4 + m.r2c1 * s2 - m.r2c3 * s0) * determinant,
                (-m.r1c0 * c3 + m.r1c1 * c1 - m.r1c2 * c0) * determinant,
                (m.r0c0 * c3 - m.r0c1 * c1 + m.r0c2 * c0) * determinant,
                (-m.r3c0 * s3 + m.r3c1 * s1 - m.r3c2 * s0) * determinant,
                (m.r2c0 * s3 - m.r2c1 * s1 + m.r2c2 * s0) * determinant
            ]);
        }
        static multiply(fma, fmb) {
            // var fma = format(matrixA);
            // var fmb = format(matrixB);
            const product = new Matrix();
            for (let i = 0; i < 4; i++) {
                const row = [fma[i], fma[i + 4], fma[i + 8], fma[i + 12]];
                for (let j = 0; j < 4; j++) {
                    const k = j * 4;
                    const col = [fmb[k], fmb[k + 1], fmb[k + 2], fmb[k + 3]];
                    const result = row[0] * col[0] + row[1] * col[1] + row[2] * col[2] + row[3] * col[3];
                    product[i + k] = result;
                }
            }
            return product;
        }
        perspective(distance) {
            const matrix = Matrix.identity();
            matrix.r2c3 = -1 / distance;
            return Matrix.multiply(this, matrix);
        }
        getRotate() {
            // const toReg = (180 / Math.PI);
            // const rotateY = Math.asin(-this.r0c2) * toReg;
            // const rotateX = Math.atan2(this.r1c2, this.r2c2) * toReg;
            // const rotateZ = Math.atan2(this.r0c1, this.r0c0) * toReg;
            const rotateY = Math.asin(-this.r0c2);
            const rotateX = Math.atan2(this.r1c2, this.r2c2);
            const rotateZ = Math.atan2(this.r0c1, this.r0c0);
            return new Vector3(rotateX, rotateY, rotateZ);
        }
        rotate(angle) {
            return this.rotateZ(angle);
        }
        rotateX(angle) {
            const theta = (Math.PI / 180) * angle;
            const matrix = Matrix.identity();
            matrix.r1c1 = matrix.r2c2 = Math.cos(theta);
            matrix.r1c2 = matrix.r2c1 = Math.sin(theta);
            matrix.r2c1 *= -1;
            return Matrix.multiply(this, matrix);
        }
        rotateY(angle) {
            const theta = (Math.PI / 180) * angle;
            const matrix = Matrix.identity();
            matrix.r0c0 = matrix.r2c2 = Math.cos(theta);
            matrix.r0c2 = matrix.r2c0 = Math.sin(theta);
            matrix.r0c2 *= -1;
            return Matrix.multiply(this, matrix);
        }
        rotateZ(angle) {
            const theta = (Math.PI / 180) * angle;
            const matrix = Matrix.identity();
            matrix.r0c0 = matrix.r1c1 = Math.cos(theta);
            matrix.r0c1 = matrix.r1c0 = Math.sin(theta);
            matrix.r1c0 *= -1;
            return Matrix.multiply(this, matrix);
        }
        getScale() {
            const x = Math.sqrt(Math.pow(this.r0c0, 2) + Math.pow(this.r1c0, 2) + Math.pow(this.r2c0, 2));
            const y = Math.sqrt(Math.pow(this.r0c1, 2) + Math.pow(this.r1c1, 2) + Math.pow(this.r2c1, 2));
            const z = Math.sqrt(Math.pow(this.r0c2, 2) + Math.pow(this.r1c2, 2) + Math.pow(this.r2c2, 2));
            return new Vector3(x, y, z);
        }
        scale(scalar, scalarY = undefined) {
            const matrix = Matrix.identity();
            matrix.r0c0 = scalar;
            matrix.r1c1 = typeof scalarY === 'number' ? scalarY : scalar;
            return Matrix.multiply(this, matrix);
        }
        scaleX(scalar) {
            const matrix = Matrix.identity();
            matrix.r0c0 = scalar;
            return Matrix.multiply(this, matrix);
        }
        scaleY(scalar) {
            const matrix = Matrix.identity();
            matrix.r1c1 = scalar;
            return Matrix.multiply(this, matrix);
        }
        scaleZ(scalar) {
            const matrix = Matrix.identity();
            matrix.r2c2 = scalar;
            return Matrix.multiply(this, matrix);
        }
        getTranslate() {
            return new Vector3(this.r3c0, this.r3c1, this.r3c2);
        }
        setTranslate(v) {
            this.r3c0 = v.x;
            this.r3c1 = v.y;
            this.r3c2 = v.z;
            return this;
        }
        translate(distanceX, distanceY) {
            const matrix = Matrix.identity();
            matrix.r3c0 = distanceX;
            if (distanceY) {
                matrix.r3c1 = distanceY;
            }
            return Matrix.multiply(this, matrix);
        }
        translate3d(distanceX, distanceY, distanceZ) {
            const matrix = Matrix.identity();
            if (distanceX !== undefined && distanceY !== undefined && distanceZ !== undefined) {
                matrix.r3c0 = distanceX;
                matrix.r3c1 = distanceY;
                matrix.r3c2 = distanceZ;
            }
            return Matrix.multiply(this, matrix);
        }
        translateX(distance) {
            const matrix = Matrix.identity();
            matrix.r3c0 = distance;
            return Matrix.multiply(this, matrix);
        }
        translateY(distance) {
            const matrix = Matrix.identity();
            matrix.r3c1 = distance;
            return Matrix.multiply(this, matrix);
        }
        translateZ(distance) {
            const matrix = Matrix.identity();
            matrix.r3c2 = distance;
            return Matrix.multiply(this, matrix);
        }
        toString() {
            return ("matrix3d(" + (this.join(', ')) + ")");
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
            Input.mousePosition = new Vector3(e.clientX, e.clientY, 0);
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
    Input.mousePosition = new Vector3(0, 0, 0);
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
            node.style.width = "1px";
            node.style.height = "1px";
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
        getPosition() {
            let bound = this.node.getBoundingClientRect();
            return new Vector3(bound.x, bound.y, 0);
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

    /**
     * 矩形の Transform
     */
    class Transform {
        constructor(node) {
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
                const computedStyle = getComputedStyle(this.node, null);
                this.matrix = Matrix.fromString(computedStyle.transform);
                this.frame = Engine.currentFrame;
            }
        }
        getWorldMatrix() {
            let node = this.node;
            this.rebuildMatrix();
            let wm = this.matrix;
            node = this.parentNode;
            while (node.nodeType === 1) {
                let transform = Transform.getTransform(node);
                transform.rebuildMatrix();
                let pm = transform.matrix;
                wm = Matrix.multiply(pm, wm);
                node = transform.parentNode;
            }
            return wm;
        }
        getTranslate() {
            this.rebuildMatrix();
            return this.matrix.getTranslate();
        }
        getRotate() {
            this.rebuildMatrix();
            return this.matrix.getRotate();
        }
        getScale() {
            this.rebuildMatrix();
            return this.matrix.getScale();
        }
        getTranslateScreen() {
            return this.vertices[Vertex.TYPE_ORIGIN].getPosition();
        }
        getRotateScreen() {
            const vec = this.vertices[Vertex.TYPE_RIGHT].getPosition().addVectors(this.vertices[Vertex.TYPE_ORIGIN].getPosition().multiply(-1));
            return Math.atan2(vec.y, vec.x);
        }
        getScaleScreenX() {
            const vec = this.vertices[Vertex.TYPE_RIGHT].getPosition().addVectors(this.vertices[Vertex.TYPE_LEFT].getPosition().multiply(-1));
            return vec.length();
        }
        getScaleScreenY() {
            const vec = this.vertices[Vertex.TYPE_BOTTOM].getPosition().addVectors(this.vertices[Vertex.TYPE_TOP].getPosition().multiply(-1));
            return vec.length();
        }
        /**
         * 画面に対しての頂点データ計算
         * @returns 頂点データ
         */
        computeVertex2D() {
            return new VertexData(this.vertices[Vertex.TYPE_LT].getPosition(), this.vertices[Vertex.TYPE_RT].getPosition(), this.vertices[Vertex.TYPE_RB].getPosition(), this.vertices[Vertex.TYPE_LB].getPosition());
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
            const selfVs = this.computeVertex2D();
            const oVecs = [selfVs.a.multiply(-1), selfVs.b.multiply(-1), selfVs.c.multiply(-1), selfVs.d.multiply(-1)];
            const collides = new Array();
            for (const otherT of Transform.nodeToIns.values()) {
                if (otherT != this) {
                    const otherVs = otherT.computeVertex2D();
                    // 線分が交わっているか
                    let isCollide = false;
                    if (Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.a, otherVs.b)
                        || Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.b, otherVs.c)
                        || Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.c, otherVs.d)
                        || Vector3.isCrossXY(selfVs.a, selfVs.b, otherVs.d, otherVs.a)
                        || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.a, otherVs.b)
                        || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.b, otherVs.c)
                        || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.c, otherVs.d)
                        || Vector3.isCrossXY(selfVs.b, selfVs.c, otherVs.d, otherVs.a)
                        || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.a, otherVs.b)
                        || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.b, otherVs.c)
                        || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.c, otherVs.d)
                        || Vector3.isCrossXY(selfVs.c, selfVs.d, otherVs.d, otherVs.a)
                        || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.a, otherVs.b)
                        || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.b, otherVs.c)
                        || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.c, otherVs.d)
                        || Vector3.isCrossXY(selfVs.d, selfVs.a, otherVs.d, otherVs.a)) {
                        isCollide = true;
                    }
                    else {
                        // 点が矩形内に入っているか
                        for (const oVec of oVecs) {
                            const otherVA = otherVs.a.addVectors(oVec);
                            const otherVB = otherVs.b.addVectors(oVec);
                            const otherVC = otherVs.c.addVectors(oVec);
                            const otherVD = otherVs.d.addVectors(oVec);
                            const crossAB = Vector3.cross(otherVA, otherVB);
                            const crossBC = Vector3.cross(otherVB, otherVC);
                            const crossCD = Vector3.cross(otherVC, otherVD);
                            const crossDA = Vector3.cross(otherVD, otherVA);
                            if (crossAB.z * crossBC.z > 0
                                && crossBC.z * crossCD.z > 0
                                && crossCD.z * crossDA.z > 0
                                && crossDA.z * crossAB.z > 0) {
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
        setTranslate(v) {
            this.rebuildMatrix();
            this.matrix.setTranslate(v);
            this.isDirty = true;
        }
        /**
         * 座標X移動
         * @param x X座標
         */
        translateX(x) {
            this.rebuildMatrix();
            this.matrix = this.matrix.translateX(x);
            this.isDirty = true;
        }
        /**
         * 座標Y移動
         * @param y Y座標
         */
        translateY(y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.translateY(y);
            this.isDirty = true;
        }
        /**
         * 座標X移動
         * @param x X座標
         */
        translateScreenX(x) {
            this.rebuildMatrix();
            let m = Matrix.identity();
            m.r3c0 = x;
            let gm = this.getWorldMatrix();
            console.log(this.getWorldMatrix());
            console.log(gm);
            gm.r0c3 = 0;
            gm.r1c3 = 0;
            gm.r2c3 = 0;
            gm.r3c0 = 0;
            gm.r3c1 = 0;
            gm.r3c2 = 0;
            let cm = Matrix.multiply(m, gm);
            this.matrix = this.matrix.translate3d(cm.r3c0, cm.r3c1, cm.r3c2);
            this.isDirty = true;
        }
        /**
         * 座標Y移動
         * @param y Y座標
         */
        translateScreenY(y) {
            this.rebuildMatrix();
            let m = Matrix.identity();
            m.r3c1 = y;
            let gm = this.getWorldMatrix();
            gm.r0c3 = 0;
            gm.r1c3 = 0;
            gm.r2c3 = 0;
            gm.r3c0 = 0;
            gm.r3c1 = 0;
            gm.r3c2 = 0;
            let cm = Matrix.multiply(m, gm);
            this.matrix = this.matrix.translate3d(cm.r3c0, cm.r3c1, cm.r3c2);
            this.isDirty = true;
        }
        /**
         * 座標移動
         * @param x X座標
         * @param y Y座標
         */
        translate(x, y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.translate(x, y);
            this.isDirty = true;
        }
        /**
         * X回転
         * @param angle ラジアン
         */
        rotateX(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotateX(angle);
            this.isDirty = true;
        }
        /**
         * Y回転
         * @param angle ラジアン
         */
        rotateY(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotateY(angle);
            this.isDirty = true;
        }
        /**
         * Z回転
         * @param angle ラジアン
         */
        rotateZ(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotateZ(angle);
            this.isDirty = true;
        }
        /**
         * 拡大X
         * @param x 増加値
         */
        scaleX(x) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scaleX(x);
            this.isDirty = true;
        }
        /**
         * 拡大Y
         * @param y 増加値
         */
        scaleY(y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scaleY(y);
            this.isDirty = true;
        }
        /**
         * 拡大Z
         * @param z 増加値
         */
        scaleZ(z) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scaleZ(z);
            this.isDirty = true;
        }
        /**
         * 拡大
         * @param {number} x 増加値X
         * @param {number} y 増加値Y
         */
        scale(x, y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scale(x, y);
            this.isDirty = true;
        }
        loopAtScreen(targetPos) {
            const targetVec = targetPos.addVectors(this.vertices[Vertex.TYPE_ORIGIN].getPosition().multiply(-1));
            const targetRad = Math.atan2(targetVec.y, targetVec.x);
            const baseVec = this.vertices[Vertex.TYPE_RIGHT].getPosition().addVectors(this.vertices[Vertex.TYPE_ORIGIN].getPosition().multiply(-1));
            const baseRad = Math.atan2(baseVec.y, baseVec.x);
            this.rotateZ((targetRad - baseRad) / (Math.PI / 180));
        }
        patch() {
            if (this.isDirty) {
                this.node.setAttribute("style", `transform: ${this.matrix.toString()}`);
            }
            this.isDirty = false;
        }
    }
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
    			attr_dev(div0, "class", "rect svelte-5x0uuw");
    			add_location(div0, file, 76, 2, 2255);
    			attr_dev(div1, "class", "rect svelte-5x0uuw");
    			add_location(div1, file, 75, 1, 2216);
    			attr_dev(div2, "class", "rect svelte-5x0uuw");
    			toggle_class(div2, "collision", /*isCollision*/ ctx[3]);
    			add_location(div2, file, 74, 0, 2149);
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

    		if (Input.isPressing("KeyW")) {
    			t1.translateScreenY(-Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyA")) {
    			t1.translateScreenX(-Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyS")) {
    			t1.translateScreenY(Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyD")) {
    			t1.translateScreenX(Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyQ")) {
    			t1.rotateZ(-Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyE")) {
    			t1.rotateZ(Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyI")) {
    			t2.translateScreenY(-Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyJ")) {
    			t2.translateScreenX(-Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyK")) {
    			t2.translateScreenY(Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyL")) {
    			t2.translateScreenX(Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyU")) {
    			t2.rotateZ(-Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyO")) {
    			t2.rotateZ(Engine.delta * 100);
    		}

    		if (Input.isPressing("KeyP")) {
    			t3.rotateZ(-Engine.delta * 100);
    		}

    		if (Input.isPressing("BracketLeft")) {
    			t3.rotateZ(Engine.delta * 100);
    		}

    		t1.loopAtScreen(Input.mousePosition);
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
