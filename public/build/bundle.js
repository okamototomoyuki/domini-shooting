
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
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
                    matrix[0] = values[0];
                    matrix[1] = values[1];
                    matrix[4] = values[2];
                    matrix[5] = values[3];
                    matrix[12] = values[4];
                    matrix[13] = values[5];
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
        get m00() { return this[0]; }
        get m01() { return this[1]; }
        get m02() { return this[2]; }
        get m03() { return this[3]; }
        get m10() { return this[4]; }
        get m11() { return this[5]; }
        get m12() { return this[6]; }
        get m13() { return this[7]; }
        get m20() { return this[8]; }
        get m21() { return this[9]; }
        get m22() { return this[10]; }
        get m23() { return this[11]; }
        get m30() { return this[12]; }
        get m31() { return this[13]; }
        get m32() { return this[14]; }
        get m33() { return this[15]; }
        inverse() {
            const m = this;
            const s0 = m[0] * m[5] - m[4] * m[1];
            const s1 = m[0] * m[6] - m[4] * m[2];
            const s2 = m[0] * m[7] - m[4] * m[3];
            const s3 = m[1] * m[6] - m[5] * m[2];
            const s4 = m[1] * m[7] - m[5] * m[3];
            const s5 = m[2] * m[7] - m[6] * m[3];
            const c5 = m[10] * m[15] - m[14] * m[11];
            const c4 = m[9] * m[15] - m[13] * m[11];
            const c3 = m[9] * m[14] - m[13] * m[10];
            const c2 = m[8] * m[15] - m[12] * m[11];
            const c1 = m[8] * m[14] - m[12] * m[10];
            const c0 = m[8] * m[13] - m[12] * m[9];
            const determinant = 1 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);
            if (isNaN(determinant) || determinant === Infinity) {
                throw new Error('Inverse determinant attempted to divide by zero.');
            }
            return Matrix.format([
                (m[5] * c5 - m[6] * c4 + m[7] * c3) * determinant,
                (-m[1] * c5 + m[2] * c4 - m[3] * c3) * determinant,
                (m[13] * s5 - m[14] * s4 + m[15] * s3) * determinant,
                (-m[9] * s5 + m[10] * s4 - m[11] * s3) * determinant,
                (-m[4] * c5 + m[6] * c2 - m[7] * c1) * determinant,
                (m[0] * c5 - m[2] * c2 + m[3] * c1) * determinant,
                (-m[12] * s5 + m[14] * s2 - m[15] * s1) * determinant,
                (m[8] * s5 - m[10] * s2 + m[11] * s1) * determinant,
                (m[4] * c4 - m[5] * c2 + m[7] * c0) * determinant,
                (-m[0] * c4 + m[1] * c2 - m[3] * c0) * determinant,
                (m[12] * s4 - m[13] * s2 + m[15] * s0) * determinant,
                (-m[8] * s4 + m[9] * s2 - m[11] * s0) * determinant,
                (-m[4] * c3 + m[5] * c1 - m[6] * c0) * determinant,
                (m[0] * c3 - m[1] * c1 + m[2] * c0) * determinant,
                (-m[12] * s3 + m[13] * s1 - m[14] * s0) * determinant,
                (m[8] * s3 - m[9] * s1 + m[10] * s0) * determinant
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
            matrix[11] = -1 / distance;
            return Matrix.multiply(this, matrix);
        }
        getRotate() {
            let rotateY = Math.asin(-this.m02);
            let rotateX = Math.atan2(this.m12, this.m22);
            let rotateZ = Math.atan2(this.m01, this.m00);
            return new Vector3(rotateX, rotateY, rotateZ);
        }
        rotate(angle) {
            return this.rotateZ(angle);
        }
        rotateX(angle) {
            const theta = (Math.PI / 180) * angle;
            const matrix = Matrix.identity();
            matrix[5] = matrix[10] = Math.cos(theta);
            matrix[6] = matrix[9] = Math.sin(theta);
            matrix[9] *= -1;
            return Matrix.multiply(this, matrix);
        }
        rotateY(angle) {
            const theta = (Math.PI / 180) * angle;
            const matrix = Matrix.identity();
            matrix[0] = matrix[10] = Math.cos(theta);
            matrix[2] = matrix[8] = Math.sin(theta);
            matrix[2] *= -1;
            return Matrix.multiply(this, matrix);
        }
        rotateZ(angle) {
            const theta = (Math.PI / 180) * angle;
            const matrix = Matrix.identity();
            matrix[0] = matrix[5] = Math.cos(theta);
            matrix[1] = matrix[4] = Math.sin(theta);
            matrix[4] *= -1;
            return Matrix.multiply(this, matrix);
        }
        getScale() {
            let x = Math.sqrt(Math.pow(this.m00, 2) + Math.pow(this.m10, 2) + Math.pow(this.m20, 2));
            let y = Math.sqrt(Math.pow(this.m01, 2) + Math.pow(this.m11, 2) + Math.pow(this.m21, 2));
            let z = Math.sqrt(Math.pow(this.m02, 2) + Math.pow(this.m12, 2) + Math.pow(this.m22, 2));
            return new Vector3(x, y, z);
        }
        scale(scalar, scalarY = undefined) {
            const matrix = Matrix.identity();
            matrix[0] = scalar;
            matrix[5] = typeof scalarY === 'number' ? scalarY : scalar;
            return Matrix.multiply(this, matrix);
        }
        scaleX(scalar) {
            const matrix = Matrix.identity();
            matrix[0] = scalar;
            return Matrix.multiply(this, matrix);
        }
        scaleY(scalar) {
            const matrix = Matrix.identity();
            matrix[5] = scalar;
            return Matrix.multiply(this, matrix);
        }
        scaleZ(scalar) {
            const matrix = Matrix.identity();
            matrix[10] = scalar;
            return Matrix.multiply(this, matrix);
        }
        getTranslate() {
            return new Vector3(this.m30, this.m31, this.m32);
        }
        translate(distanceX, distanceY) {
            const matrix = Matrix.identity();
            matrix[12] = distanceX;
            if (distanceY) {
                matrix[13] = distanceY;
            }
            return Matrix.multiply(this, matrix);
        }
        translate3d(distanceX, distanceY, distanceZ) {
            const matrix = Matrix.identity();
            if (distanceX !== undefined && distanceY !== undefined && distanceZ !== undefined) {
                matrix[12] = distanceX;
                matrix[13] = distanceY;
                matrix[14] = distanceZ;
            }
            return Matrix.multiply(this, matrix);
        }
        translateX(distance) {
            const matrix = Matrix.identity();
            matrix[12] = distance;
            return Matrix.multiply(this, matrix);
        }
        translateY(distance) {
            const matrix = Matrix.identity();
            matrix[13] = distance;
            return Matrix.multiply(this, matrix);
        }
        translateZ(distance) {
            const matrix = Matrix.identity();
            matrix[14] = distance;
            return Matrix.multiply(this, matrix);
        }
        toString() {
            return ("matrix3d(" + (this.join(', ')) + ")");
        }
    }

    /**
     * 矩形の Transform
     */
    class Transform {
        constructor(node) {
            this.frame = 0;
            this.isDirty = false;
            this.node = node;
        }
        static getTransform(node) {
            if (this.isInit == false) {
                this.isInit = true;
                this.loop();
            }
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
        static loop() {
            Transform.currentFrame = Transform.currentFrame + 1;
            for (const e of Transform.nodeToIns.values()) {
                e.patch();
            }
            requestAnimationFrame(Transform.loop);
        }
        rebuildMatrix() {
            if (this.frame != Transform.currentFrame) {
                const computedStyle = getComputedStyle(this.node, null);
                this.matrix = Matrix.fromString(computedStyle.transform);
                this.frame = Transform.currentFrame;
            }
        }
        getRotate() {
            this.rebuildMatrix();
            return this.matrix.getRotate();
        }
        getTranslate() {
            this.rebuildMatrix();
            return this.matrix.getTranslate();
        }
        getScale() {
            this.rebuildMatrix();
            return this.matrix.getScale();
        }
        // /**
        //  * 頂点データ計算
        //  * @returns 頂点データ
        //  */
        // computeVertexData(): VertexData {
        //     let w = this.node.offsetWidth;
        //     let h = this.node.offsetHeight;
        //     let v = new VertexData(
        //         new Vector3(-w / 2, -h / 2, 0),
        //         new Vector3(w / 2, -h / 2, 0),
        //         new Vector3(w / 2, h / 2, 0),
        //         new Vector3(-w / 2, h / 2, 0),
        //     );
        //     let node: HTMLElement = this.node;
        //     let transform: Transform = null;
        //     while (node.nodeType === 1) {
        //         transform = Transform.getTransform(node);
        //         v.a = v.a.rotateVector(transform.rotate).addVectors(transform.translate);
        //         v.b = v.b.rotateVector(transform.rotate).addVectors(transform.translate);
        //         v.c = v.c.rotateVector(transform.rotate).addVectors(transform.translate);
        //         v.d = v.d.rotateVector(transform.rotate).addVectors(transform.translate);
        //         node = transform.parentNode;
        //     }
        //     return v;
        // };
        // /**
        //  * 親ノード取得
        //  */
        // get parentNode(): HTMLElement {
        //     return this.node.parentNode as HTMLElement;
        // }
        /**
         * 座標X設定
         * @param x X座標
         */
        translateX(x) {
            this.rebuildMatrix();
            this.matrix = this.matrix.translateX(x);
            this.isDirty = true;
        }
        /**
         * 座標Y設定
         * @param y Y座標
         */
        translateY(y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.translateY(y);
            this.isDirty = true;
        }
        /**
         * 座標指定
         * @param x X座標
         * @param y Y座標
         */
        translate(x, y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.translate(x, y);
            this.isDirty = true;
        }
        /**
         * 回転設定
         * @param angle ラジアン
         */
        rotate(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotate(angle);
            this.isDirty = true;
        }
        /**
         * X回転設定
         * @param angle ラジアン
         */
        rotateX(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotateX(angle);
            this.isDirty = true;
        }
        /**
         * Y回転設定
         * @param angle ラジアン
         */
        rotateY(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotateY(angle);
            this.isDirty = true;
        }
        /**
         * Y回転設定
         * @param angle ラジアン
         */
        rotateZ(angle) {
            this.rebuildMatrix();
            this.matrix = this.matrix.rotateZ(angle);
            this.isDirty = true;
        }
        /**
         * 拡縮X設定
         * @param x 拡縮X
         */
        scaleX(x) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scaleX(x);
            this.isDirty = true;
        }
        /**
         * 拡縮Y設定
         * @param y 拡縮Y
         */
        scaleY(y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scaleY(y);
            this.isDirty = true;
        }
        /**
         * 拡縮Y設定
         * @param y 拡縮Y
         */
        scaleZ(z) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scaleZ(z);
            this.isDirty = true;
        }
        /**
         * 拡縮設定
         * @param {number} x 拡縮X
         * @param {number} y 拡縮Y
         */
        scale(x, y) {
            this.rebuildMatrix();
            this.matrix = this.matrix.scale(x, y);
            this.isDirty = true;
        }
        patch() {
            if (this.isDirty) {
                this.node.setAttribute("style", `transform: ${this.matrix.toString()}`);
            }
            this.isDirty = false;
        }
    }
    Transform.nodeToIns = new Map();
    Transform.currentFrame = 0;
    Transform.isInit = false;

    /* src\component\Rect.svelte generated by Svelte v3.35.0 */
    const file = "src\\component\\Rect.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-u49va3");
    			add_location(div, file, 15, 0, 334);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[5](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[5](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Rect", slots, ['default']);
    	let element;
    	let transform;

    	const getElement = () => {
    		return element;
    	};

    	const getTransform = () => {
    		return transform;
    	};

    	onMount(() => {
    		transform = Transform.getTransform(element);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rect> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Transform,
    		element,
    		transform,
    		getElement,
    		getTransform
    	});

    	$$self.$inject_state = $$props => {
    		if ("element" in $$props) $$invalidate(0, element = $$props.element);
    		if ("transform" in $$props) transform = $$props.transform;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [element, getElement, getTransform, $$scope, slots, div_binding];
    }

    class Rect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { getElement: 1, getTransform: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rect",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get getElement() {
    		return this.$$.ctx[1];
    	}

    	set getElement(value) {
    		throw new Error("<Rect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getTransform() {
    		return this.$$.ctx[2];
    	}

    	set getTransform(value) {
    		throw new Error("<Rect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;

    // (19:0) <Rect bind:this={rect}>
    function create_default_slot(ctx) {
    	let rect_1;
    	let current;
    	let rect_1_props = {};
    	rect_1 = new Rect({ props: rect_1_props, $$inline: true });
    	/*rect_1_binding*/ ctx[2](rect_1);

    	const block = {
    		c: function create() {
    			create_component(rect_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rect_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const rect_1_changes = {};
    			rect_1.$set(rect_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rect_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rect_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*rect_1_binding*/ ctx[2](null);
    			destroy_component(rect_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(19:0) <Rect bind:this={rect}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let rect_1;
    	let current;

    	let rect_1_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	rect_1 = new Rect({ props: rect_1_props, $$inline: true });
    	/*rect_1_binding_1*/ ctx[3](rect_1);

    	const block = {
    		c: function create() {
    			create_component(rect_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(rect_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const rect_1_changes = {};

    			if (dirty & /*$$scope, rect2*/ 34) {
    				rect_1_changes.$$scope = { dirty, ctx };
    			}

    			rect_1.$set(rect_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rect_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rect_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*rect_1_binding_1*/ ctx[3](null);
    			destroy_component(rect_1, detaching);
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

    	onMount(() => {
    		loop();
    	});

    	const loop = () => {
    		let t = rect === null || rect === void 0
    		? void 0
    		: rect.getTransform();

    		let t2 = rect2.getTransform();
    		t.rotateX(1);

    		// console.log(t.getRotate());
    		t2.scaleX(1.001);

    		console.log(t2.getScale());
    		requestAnimationFrame(loop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function rect_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rect2 = $$value;
    			$$invalidate(1, rect2);
    		});
    	}

    	function rect_1_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rect = $$value;
    			$$invalidate(0, rect);
    		});
    	}

    	$$self.$capture_state = () => ({ onMount, Rect, rect, rect2, loop });

    	$$self.$inject_state = $$props => {
    		if ("rect" in $$props) $$invalidate(0, rect = $$props.rect);
    		if ("rect2" in $$props) $$invalidate(1, rect2 = $$props.rect2);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rect, rect2, rect_1_binding, rect_1_binding_1];
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
