import { run_all } from './utils';
import { current_component, set_current_component } from './lifecycle';

export const dirty_components = [];
export const intros = { enabled: false };

export const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];

const resolved_promise = Promise.resolve();
let update_scheduled = false; // 避免每次有值变化都执行一遍schedule_update，flush会更新所有dirty_component组件

export function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true; // flush结束时，把update_scheduled重新设置为false
		resolved_promise.then(flush);
	}
}

export function tick() {
	schedule_update();
	return resolved_promise;
}

export function add_render_callback(fn) {
	render_callbacks.push(fn);
}

export function add_flush_callback(fn) {
	flush_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0;  // Do *not* move this inside the flush() function
export function flush() {
	const saved_component = current_component;

	do {
		// first, call beforeUpdate functions
		// and update components
		while (flushidx < dirty_components.length) {
			const component = dirty_components[flushidx];
			flushidx++;
			set_current_component(component);
			update(component.$$);
		}
		set_current_component(null);

		dirty_components.length = 0;
		flushidx = 0;
    // 单独一个阶段执行全部binding，这样可以保证beforeUpdate中即使改变bind变量，获取的也是未更新的值
		while (binding_callbacks.length) binding_callbacks.pop()(); // 设置组件$$.bound，并立即执行一次

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
	seen_callbacks.clear();
	set_current_component(saved_component);
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
