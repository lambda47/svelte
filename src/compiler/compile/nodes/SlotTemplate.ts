import Component from '../Component';
import TemplateScope from './shared/TemplateScope';
import Node from './shared/Node';
import Let from './Let';
import Attribute from './Attribute';
import { INode } from './interfaces';
import compiler_errors from '../compiler_errors';
import get_const_tags from './shared/get_const_tags';
import ConstTag from './ConstTag';

export default class SlotTemplate extends Node {
	type: 'SlotTemplate';
	scope: TemplateScope;
	children: INode[];
	lets: Let[] = [];
	const_tags: ConstTag[];
	slot_attribute: Attribute;
	slot_template_name: string = 'default';

	constructor(
		component: Component,
		parent: INode,
		scope: TemplateScope,
		info: any
	) {
		super(component, parent, scope, info);

		this.validate_slot_template_placement();

		scope = scope.child();

		info.attributes.forEach((node) => {
			switch (node.type) {
				case 'Let': { // <svelte:frament let:item={item}>
					const l = new Let(component, this, scope, node);
					this.lets.push(l);
					const dependencies = new Set([l.name.name]);

					l.names.forEach((name) => {
						scope.add(name, dependencies, this);
					});
					break;
				}
				case 'Attribute': { // <svelte:fratment slot="footer">
					if (node.name === 'slot') {
						this.slot_attribute = new Attribute(component, this, scope, node);
						if (!this.slot_attribute.is_static) {
							return component.error(node, compiler_errors.invalid_slot_attribute);
						}
						const value = this.slot_attribute.get_static_value();
						if (typeof value === 'boolean') {
							return component.error(node, compiler_errors.invalid_slot_attribute_value_missing);
						}
						this.slot_template_name = value as string;
						break;
					}
					throw new Error(`Invalid attribute '${node.name}' in <svelte:fragment>`);
				}
				default:
					throw new Error(`Not implemented: ${node.type}`);
			}
		});

		this.scope = scope;
		([this.const_tags, this.children] = get_const_tags(info.children, component, this, this));
	}

	validate_slot_template_placement() {
		if (this.parent.type !== 'InlineComponent') {
			return this.component.error(this, compiler_errors.invalid_slotted_content_fragment);
		}
	}
}
