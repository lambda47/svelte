import Node from './shared/Node';
import EventHandler from './EventHandler';
import Action from './Action';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { Element } from '../../interfaces';

export default class Body extends Node {
	type: 'Body';
	handlers: EventHandler[] = [];
	actions: Action[] = [];

	constructor(component: Component, parent: Node, scope: TemplateScope, info: Element) {
		super(component, parent, scope, info);

		info.attributes.forEach((node) => {
			if (node.type === 'EventHandler') { // 事件处理函数 (on:event={handler})
				this.handlers.push(new EventHandler(component, this, scope, node));
			} else if (node.type === 'Action') { // 生命周期hook (use:action={parameters})
				this.actions.push(new Action(component, this, scope, node));
			} else {
				// TODO there shouldn't be anything else here...
			}
		});
	}
}
