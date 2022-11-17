import Node from './shared/Node';
import map_children from './shared/map_children';
import hash from '../utils/hash';
import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import { TemplateNode } from '../../interfaces';
import compiler_errors from '../compiler_errors';
import { regex_non_whitespace_character } from '../../utils/patterns';

export default class Head extends Node { // 用于向head标签中插入元素
	type: 'Head';
	children: any[]; // TODO
	id: string;

	constructor(component: Component, parent: Node, scope: TemplateScope, info: TemplateNode) {
		super(component, parent, scope, info);

		if (info.attributes.length) { // 不能有属性
			component.error(info.attributes[0], compiler_errors.invalid_attribute_head);
			return;
		}

		this.children = map_children(component, parent, scope, info.children.filter(child => {
			return (child.type !== 'Text' || regex_non_whitespace_character.test(child.data));
		}));

		if (this.children.length > 0) {
			this.id = `svelte-${hash(this.component.source.slice(this.start, this.end))}`;
		}
	}
}
