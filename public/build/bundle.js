
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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
            if (typeof $$scope.dirty === 'object') {
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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
    }

    /* src\button.svelte generated by Svelte v3.18.2 */

    const file = "src\\button.svelte";

    function create_fragment(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "svelte-lnii6t");
    			add_location(button, file, 13, 0, 226);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
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
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
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
    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\book.svelte generated by Svelte v3.18.2 */
    const file$1 = "src\\book.svelte";

    // (38:4) <Button on:click={purchaseBook}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Buy");
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(38:4) <Button on:click={purchaseBook}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h1;
    	let t0;
    	let t1;
    	let h2;
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let t5;
    	let current;

    	const button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*purchaseBook*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(/*bookTitle*/ ctx[0]);
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*bookPages*/ ctx[1]);
    			t3 = space();
    			p = element("p");
    			t4 = text(/*bookDescription*/ ctx[2]);
    			t5 = space();
    			create_component(button.$$.fragment);
    			attr_dev(h1, "class", "svelte-b06ty7");
    			add_location(h1, file$1, 34, 4, 659);
    			attr_dev(h2, "class", "svelte-b06ty7");
    			add_location(h2, file$1, 35, 4, 687);
    			attr_dev(p, "class", "svelte-b06ty7");
    			add_location(p, file$1, 36, 4, 714);
    			attr_dev(div, "class", "svelte-b06ty7");
    			add_location(div, file$1, 33, 0, 648);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    			append_dev(div, t3);
    			append_dev(div, p);
    			append_dev(p, t4);
    			append_dev(div, t5);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*bookTitle*/ 1) set_data_dev(t0, /*bookTitle*/ ctx[0]);
    			if (!current || dirty & /*bookPages*/ 2) set_data_dev(t2, /*bookPages*/ ctx[1]);
    			if (!current || dirty & /*bookDescription*/ 4) set_data_dev(t4, /*bookDescription*/ ctx[2]);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
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
    	let { bookTitle } = $$props;
    	let { bookPages } = $$props;
    	let { bookDescription } = $$props;
    	const dispatch = createEventDispatcher();

    	function purchaseBook() {
    		dispatch("buy", bookTitle);
    	}

    	const writable_props = ["bookTitle", "bookPages", "bookDescription"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Book> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("bookTitle" in $$props) $$invalidate(0, bookTitle = $$props.bookTitle);
    		if ("bookPages" in $$props) $$invalidate(1, bookPages = $$props.bookPages);
    		if ("bookDescription" in $$props) $$invalidate(2, bookDescription = $$props.bookDescription);
    	};

    	$$self.$capture_state = () => {
    		return { bookTitle, bookPages, bookDescription };
    	};

    	$$self.$inject_state = $$props => {
    		if ("bookTitle" in $$props) $$invalidate(0, bookTitle = $$props.bookTitle);
    		if ("bookPages" in $$props) $$invalidate(1, bookPages = $$props.bookPages);
    		if ("bookDescription" in $$props) $$invalidate(2, bookDescription = $$props.bookDescription);
    	};

    	return [bookTitle, bookPages, bookDescription, purchaseBook];
    }

    class Book extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			bookTitle: 0,
    			bookPages: 1,
    			bookDescription: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Book",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bookTitle*/ ctx[0] === undefined && !("bookTitle" in props)) {
    			console.warn("<Book> was created without expected prop 'bookTitle'");
    		}

    		if (/*bookPages*/ ctx[1] === undefined && !("bookPages" in props)) {
    			console.warn("<Book> was created without expected prop 'bookPages'");
    		}

    		if (/*bookDescription*/ ctx[2] === undefined && !("bookDescription" in props)) {
    			console.warn("<Book> was created without expected prop 'bookDescription'");
    		}
    	}

    	get bookTitle() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookTitle(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookPages() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookPages(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookDescription() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookDescription(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\purchase.svelte generated by Svelte v3.18.2 */

    const file$2 = "src\\purchase.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (25:4) {#each books as book}
    function create_each_block(ctx) {
    	let li;
    	let t0_value = /*book*/ ctx[1].title + "";
    	let t0;
    	let t1;
    	let t2_value = /*book*/ ctx[1].pages + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = text(" pages");
    			attr_dev(li, "class", "svelte-1imksoc");
    			add_location(li, file$2, 25, 4, 346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*books*/ 1 && t0_value !== (t0_value = /*book*/ ctx[1].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*books*/ 1 && t2_value !== (t2_value = /*book*/ ctx[1].pages + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(25:4) {#each books as book}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let ul;
    	let each_value = /*books*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1imksoc");
    			add_location(ul, file$2, 23, 0, 309);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*books*/ 1) {
    				each_value = /*books*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { books } = $$props;
    	const writable_props = ["books"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Purchase> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("books" in $$props) $$invalidate(0, books = $$props.books);
    	};

    	$$self.$capture_state = () => {
    		return { books };
    	};

    	$$self.$inject_state = $$props => {
    		if ("books" in $$props) $$invalidate(0, books = $$props.books);
    	};

    	return [books];
    }

    class Purchase extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { books: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Purchase",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*books*/ ctx[0] === undefined && !("books" in props)) {
    			console.warn("<Purchase> was created without expected prop 'books'");
    		}
    	}

    	get books() {
    		throw new Error("<Purchase>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set books(value) {
    		throw new Error("<Purchase>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.2 */
    const file$3 = "src\\App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (58:1) <Button on:click={addBook}>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("ADD Book");
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(58:1) <Button on:click={addBook}>",
    		ctx
    	});

    	return block;
    }

    // (67:1) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*books*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*books, purchaseBook*/ 136) {
    				each_value = /*books*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(67:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:0) {#if books.length === 0}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Add a new book";
    			add_location(p, file$3, 63, 1, 1190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(63:0) {#if books.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (68:1) {#each books as book}
    function create_each_block$1(ctx) {
    	let current;

    	const book = new Book({
    			props: {
    				bookTitle: /*book*/ ctx[10].title,
    				bookPages: /*book*/ ctx[10].pages,
    				bookDescription: /*book*/ ctx[10].description
    			},
    			$$inline: true
    		});

    	book.$on("buy", /*purchaseBook*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(book.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(book, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const book_changes = {};
    			if (dirty & /*books*/ 8) book_changes.bookTitle = /*book*/ ctx[10].title;
    			if (dirty & /*books*/ 8) book_changes.bookPages = /*book*/ ctx[10].pages;
    			if (dirty & /*books*/ 8) book_changes.bookDescription = /*book*/ ctx[10].description;
    			book.$set(book_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(book.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(book.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(book, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(68:1) {#each books as book}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section0;
    	let div0;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let label1;
    	let t4;
    	let input1;
    	let input1_updating = false;
    	let t5;
    	let div2;
    	let label2;
    	let t7;
    	let textarea;
    	let t8;
    	let t9;
    	let section1;
    	let current_block_type_index;
    	let if_block;
    	let t10;
    	let hr;
    	let t11;
    	let section2;
    	let current;
    	let dispose;

    	function input1_input_handler() {
    		input1_updating = true;
    		/*input1_input_handler*/ ctx[8].call(input1);
    	}

    	const button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*addBook*/ ctx[6]);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*books*/ ctx[3].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const purchase = new Purchase({
    			props: { books: /*purchases*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "pages";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Description";
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			create_component(button.$$.fragment);
    			t9 = space();
    			section1 = element("section");
    			if_block.c();
    			t10 = space();
    			hr = element("hr");
    			t11 = space();
    			section2 = element("section");
    			create_component(purchase.$$.fragment);
    			attr_dev(label0, "for", "title");
    			attr_dev(label0, "class", "svelte-1bubaqo");
    			add_location(label0, file$3, 43, 2, 747);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "title");
    			input0.value = /*title*/ ctx[0];
    			attr_dev(input0, "class", "svelte-1bubaqo");
    			add_location(input0, file$3, 44, 2, 782);
    			add_location(div0, file$3, 42, 1, 738);
    			attr_dev(label1, "for", "pages");
    			attr_dev(label1, "class", "svelte-1bubaqo");
    			add_location(label1, file$3, 48, 2, 866);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "price");
    			attr_dev(input1, "class", "svelte-1bubaqo");
    			add_location(input1, file$3, 49, 2, 902);
    			add_location(div1, file$3, 47, 1, 858);
    			attr_dev(label2, "for", "description");
    			attr_dev(label2, "class", "svelte-1bubaqo");
    			add_location(label2, file$3, 53, 2, 975);
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "id", "description");
    			attr_dev(textarea, "class", "svelte-1bubaqo");
    			add_location(textarea, file$3, 54, 2, 1022);
    			add_location(div2, file$3, 52, 1, 967);
    			attr_dev(section0, "class", "svelte-1bubaqo");
    			add_location(section0, file$3, 41, 0, 727);
    			attr_dev(section1, "class", "svelte-1bubaqo");
    			add_location(section1, file$3, 61, 0, 1154);
    			add_location(hr, file$3, 78, 0, 1404);
    			attr_dev(section2, "class", "svelte-1bubaqo");
    			add_location(section2, file$3, 80, 0, 1410);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			append_dev(section0, t2);
    			append_dev(section0, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*pages*/ ctx[1]);
    			append_dev(section0, t5);
    			append_dev(section0, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t7);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*description*/ ctx[2]);
    			append_dev(section0, t8);
    			mount_component(button, section0, null);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, section1, anchor);
    			if_blocks[current_block_type_index].m(section1, null);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, section2, anchor);
    			mount_component(purchase, section2, null);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*setTitle*/ ctx[5], false, false, false),
    				listen_dev(input1, "input", input1_input_handler),
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[9])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1 && input0.value !== /*title*/ ctx[0]) {
    				prop_dev(input0, "value", /*title*/ ctx[0]);
    			}

    			if (!input1_updating && dirty & /*pages*/ 2) {
    				set_input_value(input1, /*pages*/ ctx[1]);
    			}

    			input1_updating = false;

    			if (dirty & /*description*/ 4) {
    				set_input_value(textarea, /*description*/ ctx[2]);
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope*/ 8192) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(section1, null);
    			}

    			const purchase_changes = {};
    			if (dirty & /*purchases*/ 16) purchase_changes.books = /*purchases*/ ctx[4];
    			purchase.$set(purchase_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(purchase.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(purchase.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			destroy_component(button);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(section1);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(section2);
    			destroy_component(purchase);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let title = "";
    	let pages = 0;
    	let description = "";
    	let books = [];
    	let purchases = [];

    	function setTitle(event) {
    		$$invalidate(0, title = event.target.value);
    	}

    	function addBook() {
    		const newBook = { title, pages, description };
    		$$invalidate(3, books = books.concat(newBook));
    	}

    	function purchaseBook(event) {
    		const selectedTitle = event.detail;

    		$$invalidate(4, purchases = purchases.concat({
    			...books.find(book => book.title === selectedTitle)
    		}));
    	}

    	function input1_input_handler() {
    		pages = to_number(this.value);
    		$$invalidate(1, pages);
    	}

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate(2, description);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("pages" in $$props) $$invalidate(1, pages = $$props.pages);
    		if ("description" in $$props) $$invalidate(2, description = $$props.description);
    		if ("books" in $$props) $$invalidate(3, books = $$props.books);
    		if ("purchases" in $$props) $$invalidate(4, purchases = $$props.purchases);
    	};

    	return [
    		title,
    		pages,
    		description,
    		books,
    		purchases,
    		setTitle,
    		addBook,
    		purchaseBook,
    		input1_input_handler,
    		textarea_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
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
