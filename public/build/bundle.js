
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
    function get_custom_elements_slots(element) {
        const result = {};
        element.childNodes.forEach((node) => {
            result[node.slot || 'default'] = true;
        });
        return result;
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
     * 4x4行列
     */
    class Matrix {
        /**
         * コンストラクタ
         * @param m11 c1r1
         * @param m21 c1r2
         * @param m31 c1r3
         * @param m41 c1r4
         * @param m12 c2r1
         * @param m22 c2r2
         * @param m32 c2r3
         * @param m42 c2r4
         * @param m13 c3r1
         * @param m23 c3r2
         * @param m33 c3r3
         * @param m43 c3r4
         * @param m14 c4r1
         * @param m24 c4r2
         * @param m34 c4r3
         * @param m44 c4r4
         */
        constructor(m11, m21, m31, m41, m12, m22, m32, m42, m13, m23, m33, m43, m14, m24, m34, m44) {
            this.m11 = m11;
            this.m21 = m21;
            this.m31 = m31;
            this.m41 = m41;
            this.m12 = m12;
            this.m22 = m22;
            this.m32 = m32;
            this.m42 = m42;
            this.m13 = m13;
            this.m23 = m23;
            this.m33 = m33;
            this.m43 = m43;
            this.m14 = m14;
            this.m24 = m24;
            this.m34 = m34;
            this.m44 = m44;
        }
        /**
         * CSS Transform 文字列からパース
         * @param matrixString CSS Transform 文字列
         * @returns Matrix
         */
        static parse(matrixString) {
            let c = matrixString.split(/\s*[(),]\s*/).slice(1, -1);
            if (c.length === 6) {
                // 'matrix()' (3x2)
                return new Matrix(+c[0], +c[2], 0, +c[4], +c[1], +c[3], 0, +c[5], 0, 0, 1, 0, 0, 0, 0, 1);
            }
            else if (c.length === 16) {
                // matrix3d() (4x4)
                return new Matrix(+c[0], +c[4], +c[8], +c[12], +c[1], +c[5], +c[9], +c[13], +c[2], +c[6], +c[10], +c[14], +c[3], +c[7], +c[11], +c[15]);
            }
            else {
                // handle 'none' or invalid values.
                return new Matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            }
        }
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
    }

    /**
     * 矩形の Transform
     */
    class Transform {
        constructor(node, transformStyle, matrix, rotate, translate) {
            this.node = node;
            this.transformStyle = transformStyle;
            this.matrix = matrix;
            this.rotate = rotate;
            this.translate = translate;
        }
        static getTransform(node) {
            let computedStyle = getComputedStyle(node, null);
            let val = computedStyle.transform;
            let matrix = Matrix.parse(val);
            let rotateY = Math.asin(-matrix.m13);
            let rotateX = Math.atan2(matrix.m23, matrix.m33);
            let rotateZ = Math.atan2(matrix.m12, matrix.m11);
            return new Transform(node, val, matrix, new Vector3(rotateX, rotateY, rotateZ), new Vector3(matrix.m41, matrix.m42, matrix.m43));
        }
        /**
         * 頂点データ計算
         * @returns 頂点データ
         */
        computeVertexData() {
            let w = this.node.offsetWidth;
            let h = this.node.offsetHeight;
            let v = new VertexData(new Vector3(-w / 2, -h / 2, 0), new Vector3(w / 2, -h / 2, 0), new Vector3(w / 2, h / 2, 0), new Vector3(-w / 2, h / 2, 0));
            let node = this.node;
            let transform = null;
            while (node.nodeType === 1) {
                transform = Transform.getTransform(node);
                v.a = v.a.rotateVector(transform.rotate).addVectors(transform.translate);
                v.b = v.b.rotateVector(transform.rotate).addVectors(transform.translate);
                v.c = v.c.rotateVector(transform.rotate).addVectors(transform.translate);
                v.d = v.d.rotateVector(transform.rotate).addVectors(transform.translate);
                node = transform.parentNode;
            }
            return v;
        }
        ;
        /**
         * 親ノード取得
         */
        get parentNode() {
            return this.node.parentNode;
        }
        /**
         * 回転
         * @param rot ラジアン
         */
        setRotate(rot) {
        }
        buildStyle() {
            this.node.setAttribute("style", `transform: translate(${this.translate.x}px, ${this.translate.y}px) rotate(${this.rotate.z}deg) scale(, )`);
        }
    }

    /* src\component\Rect.svelte generated by Svelte v3.35.0 */
    const file = "src\\component\\Rect.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-1cpen9t");
    			add_location(div, file, 16, 0, 396);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[3](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[3](null);
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
    	validate_slots("Rect", slots, []);
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

    	$$self.$capture_state = () => ({
    		onMount,
    		get_custom_elements_slots,
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

    	return [element, getElement, getTransform, div_binding];
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

    function create_fragment(ctx) {
    	let rect_1;
    	let current;
    	let rect_1_props = {};
    	rect_1 = new Rect({ props: rect_1_props, $$inline: true });
    	/*rect_1_binding*/ ctx[1](rect_1);

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
    			/*rect_1_binding*/ ctx[1](null);
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

    	onMount(() => {
    		loop();
    	});

    	const loop = () => {
    		let t = rect.getTransform();
    		let style = getComputedStyle(t.node);

    		// var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    		console.log("p:" + style.transform);

    		requestAnimationFrame(loop);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function rect_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rect = $$value;
    			$$invalidate(0, rect);
    		});
    	}

    	$$self.$capture_state = () => ({ onMount, Rect, rect, loop });

    	$$self.$inject_state = $$props => {
    		if ("rect" in $$props) $$invalidate(0, rect = $$props.rect);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rect, rect_1_binding];
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
