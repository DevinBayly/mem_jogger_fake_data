
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
            throw new Error(`Function called outside component initialization`);
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/VisOption.svelte generated by Svelte v3.23.0 */
    const file = "src/VisOption.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let div0;
    	let h3;
    	let t1;
    	let t2;
    	let div1;
    	let p;
    	let t3;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			div1 = element("div");
    			p = element("p");
    			t3 = text(/*summaryText*/ ctx[2]);
    			if (img.src !== (img_src_value = /*imgSrc*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "id", "background");
    			attr_dev(img, "class", "svelte-1i33cp5");
    			add_location(img, file, 52, 2, 925);
    			attr_dev(h3, "class", "svelte-1i33cp5");
    			add_location(h3, file, 55, 4, 1049);
    			attr_dev(div0, "id", "title");
    			attr_dev(div0, "class", "text svelte-1i33cp5");
    			add_location(div0, file, 54, 2, 1015);
    			attr_dev(p, "class", "svelte-1i33cp5");
    			add_location(p, file, 58, 4, 1113);
    			attr_dev(div1, "id", "summary");
    			attr_dev(div1, "class", "text svelte-1i33cp5");
    			add_location(div1, file, 57, 2, 1077);
    			attr_dev(div2, "id", "content");
    			attr_dev(div2, "class", "svelte-1i33cp5");
    			add_location(div2, file, 53, 2, 994);
    			attr_dev(div3, "id", "optionHolder");
    			attr_dev(div3, "class", "svelte-1i33cp5");
    			add_location(div3, file, 51, 0, 880);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, img);
    			/*img_binding*/ ctx[5](img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			/*div3_binding*/ ctx[6](div3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imgSrc*/ 1 && img.src !== (img_src_value = /*imgSrc*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (dirty & /*summaryText*/ 4) set_data_dev(t3, /*summaryText*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*img_binding*/ ctx[5](null);
    			/*div3_binding*/ ctx[6](null);
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
    	let { imgSrc } = $$props, { title } = $$props, { summaryText } = $$props;
    	let imgElement;
    	let holder;

    	onMount(() => {
    		// move the image into the top corner of the half
    		let holderRect = holder.getBoundingClientRect();

    		$$invalidate(3, imgElement.style.position = "absolute", imgElement);
    		$$invalidate(3, imgElement.style.top = holderRect.top + "px", imgElement);
    		$$invalidate(3, imgElement.style.left = holderRect.left + "px", imgElement);
    	});

    	const writable_props = ["imgSrc", "title", "summaryText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VisOption> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("VisOption", $$slots, []);

    	function img_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, imgElement = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, holder = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("imgSrc" in $$props) $$invalidate(0, imgSrc = $$props.imgSrc);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("summaryText" in $$props) $$invalidate(2, summaryText = $$props.summaryText);
    	};

    	$$self.$capture_state = () => ({
    		imgSrc,
    		title,
    		summaryText,
    		onMount,
    		imgElement,
    		holder
    	});

    	$$self.$inject_state = $$props => {
    		if ("imgSrc" in $$props) $$invalidate(0, imgSrc = $$props.imgSrc);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("summaryText" in $$props) $$invalidate(2, summaryText = $$props.summaryText);
    		if ("imgElement" in $$props) $$invalidate(3, imgElement = $$props.imgElement);
    		if ("holder" in $$props) $$invalidate(4, holder = $$props.holder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [imgSrc, title, summaryText, imgElement, holder, img_binding, div3_binding];
    }

    class VisOption extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { imgSrc: 0, title: 1, summaryText: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VisOption",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*imgSrc*/ ctx[0] === undefined && !("imgSrc" in props)) {
    			console.warn("<VisOption> was created without expected prop 'imgSrc'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<VisOption> was created without expected prop 'title'");
    		}

    		if (/*summaryText*/ ctx[2] === undefined && !("summaryText" in props)) {
    			console.warn("<VisOption> was created without expected prop 'summaryText'");
    		}
    	}

    	get imgSrc() {
    		throw new Error("<VisOption>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgSrc(value) {
    		throw new Error("<VisOption>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<VisOption>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<VisOption>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get summaryText() {
    		throw new Error("<VisOption>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summaryText(value) {
    		throw new Error("<VisOption>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.23.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let div4;
    	let div0;
    	let h3;
    	let t1;
    	let div3;
    	let div1;
    	let t2;
    	let div2;
    	let current;
    	let mounted;
    	let dispose;

    	const visop0 = new VisOption({
    			props: {
    				imgSrc: "gantt_background.png",
    				title: "Gantt Chart",
    				summaryText: "View your data from the last 2 weeks with particular attention to the 'when' you were in a location"
    			},
    			$$inline: true
    		});

    	const visop1 = new VisOption({
    			props: {
    				imgSrc: "map_background.png",
    				title: "Map Visualization",
    				summaryText: "Explore where you've been on campus for over 15 minutes at a time overlaid on this campus map"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Memory Jogger";
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			create_component(visop0.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(visop1.$$.fragment);
    			attr_dev(h3, "class", "svelte-c3dbnw");
    			add_location(h3, file$1, 36, 4, 568);
    			attr_dev(div0, "id", "title");
    			attr_dev(div0, "class", "svelte-c3dbnw");
    			add_location(div0, file$1, 35, 2, 547);
    			attr_dev(div1, "id", "gantt-side");
    			attr_dev(div1, "class", "svelte-c3dbnw");
    			add_location(div1, file$1, 39, 2, 623);
    			attr_dev(div2, "id", "map-side");
    			attr_dev(div2, "class", "svelte-c3dbnw");
    			add_location(div2, file$1, 42, 2, 858);
    			attr_dev(div3, "id", "options");
    			attr_dev(div3, "class", "svelte-c3dbnw");
    			add_location(div3, file$1, 38, 2, 602);
    			attr_dev(div4, "id", "holder");
    			attr_dev(div4, "class", "svelte-c3dbnw");
    			add_location(div4, file$1, 34, 0, 527);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, h3);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			mount_component(visop0, div1, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			mount_component(visop1, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*gantt*/ ctx[0], false, false, false),
    					listen_dev(div2, "click", /*map*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(visop0.$$.fragment, local);
    			transition_in(visop1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(visop0.$$.fragment, local);
    			transition_out(visop1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(visop0);
    			destroy_component(visop1);
    			mounted = false;
    			run_all(dispose);
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
    	let gantt = () => {
    		console.log("loading gantt");
    	};

    	let map = () => {
    		console.log("loading map");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ VisOp: VisOption, gantt, map });

    	$$self.$inject_state = $$props => {
    		if ("gantt" in $$props) $$invalidate(0, gantt = $$props.gantt);
    		if ("map" in $$props) $$invalidate(1, map = $$props.map);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [gantt, map];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
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
