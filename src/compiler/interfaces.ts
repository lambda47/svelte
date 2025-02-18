import { AssignmentExpression, Node, Program } from 'estree';
import { SourceMap } from 'magic-string';

interface BaseNode {
	start: number;
	end: number;
	type: string;
	children?: TemplateNode[];
	[prop_name: string]: any;
}

export interface Fragment extends BaseNode {
	type: 'Fragment';
	children: TemplateNode[];
}

export interface Text extends BaseNode {
	type: 'Text';
	data: string;
}

export interface MustacheTag extends BaseNode {
	type: 'MustacheTag' | 'RawMustacheTag';
	expression: Node;
}

export interface Comment extends BaseNode {
	type: 'Comment';
	data: string;
	ignores: string[];
}

export interface ConstTag extends BaseNode {
	type: 'ConstTag';
	expression: AssignmentExpression;
}

interface DebugTag extends BaseNode {
	type: 'DebugTag';
	identifiers: Node[]
}

export type DirectiveType = 'Action'
| 'Animation'
| 'Binding'
| 'Class'
| 'StyleDirective'
| 'EventHandler'
| 'Let'
| 'Ref'
| 'Transition';

interface BaseDirective extends BaseNode {
	type: DirectiveType;
	name: string;
}

interface BaseExpressionDirective extends BaseDirective {
	type: DirectiveType;
	expression: null | Node;
	name: string;
	modifiers: string[];
}

export interface Element extends BaseNode {
	type: 'InlineComponent' | 'SlotTemplate' | 'Title' | 'Slot' | 'Element' | 'Head' | 'Options' | 'Window' | 'Body';
	attributes: Array<BaseDirective | Attribute | SpreadAttribute>;
	name: string;
}

export interface Attribute extends BaseNode {
	type: 'Attribute';
	name: string;
	value: any[];
}

export interface SpreadAttribute extends BaseNode {
	type: 'Spread';
	expression: Node;
}

export interface Transition extends BaseExpressionDirective {
	type: 'Transition';
	intro: boolean;
	outro: boolean;
}

export type Directive = BaseDirective | BaseExpressionDirective | Transition;

export type TemplateNode = Text
| ConstTag
| DebugTag
| MustacheTag
| BaseNode
| Element
| Attribute
| SpreadAttribute
| Directive
| Transition
| Comment;

export interface Parser {
	readonly template: string;
	readonly filename?: string;

	index: number;
	stack: Node[];

	html: Node;
	css: Node;
	js: Node;
	meta_tags: {};
}

export interface Script extends BaseNode {
	type: 'Script';
	context: string;
	content: Program;
}

export interface Style extends BaseNode {
	type: 'Style';
	attributes: any[]; // TODO
	children: any[]; // TODO add CSS node types
	content: {
		start: number;
		end: number;
		styles: string;
	};
}

export interface Ast {
	html: TemplateNode;
	css?: Style;
	instance?: Script;
	module?: Script;
}

export interface Warning {
	start?: { line: number; column: number; pos?: number };
	end?: { line: number; column: number };
	pos?: number;
	code: string;
	message: string;
	filename?: string;
	frame?: string;
	toString: () => string;
}

export type ModuleFormat = 'esm' | 'cjs';

export type EnableSourcemap = boolean | { js: boolean; css: boolean };

export type CssHashGetter = (args: {
	name: string;
	filename: string | undefined;
	css: string;
	hash: (input: string) => string;
}) => string;

export interface CompileOptions {
	format?: ModuleFormat;
	name?: string;
	filename?: string;
	generate?: 'dom' | 'ssr' | false;
	errorMode?: 'throw' | 'warn';
	varsReport?: 'full' | 'strict' | false;

	sourcemap?: object | string;
	enableSourcemap?: EnableSourcemap;
	outputFilename?: string;
	cssOutputFilename?: string;
	sveltePath?: string;

	dev?: boolean;
	accessors?: boolean;
	immutable?: boolean;
	hydratable?: boolean;
	legacy?: boolean;
	customElement?: boolean;
	tag?: string;
	css?: 'injected' | 'external' | 'none' | boolean;
	loopGuardTimeout?: number;
	namespace?: string;
	cssHash?: CssHashGetter;

	preserveComments?: boolean;
	preserveWhitespace?: boolean;
}

export interface ParserOptions {
	filename?: string;
	customElement?: boolean;
	css?: 'injected' | 'external' | 'none' | boolean;
}

export interface Visitor {
	enter: (node: Node) => void;
	leave?: (node: Node) => void;
}

export interface AppendTarget {
	slots: Record<string, string>;
	slot_stack: string[];
}

export interface Var {
	name: string;
	export_name?: string; // the `bar` in `export { foo as bar }`
	injected?: boolean; // is true if the declaration is injected by Svelte, rather than in the code you wrote 是否为svelte生成的变量，false为用户定义变量
	module?: boolean; // context="module"
	mutated?: boolean; // if the value's properties are assigned to inside the component 值的属性是否在组件内被修改
	reassigned?: boolean; // 值是否在组件内被改动
	referenced?: boolean;  // referenced from template scope
	referenced_from_script?: boolean; // referenced from script
	writable?: boolean;

	// used internally, but not exposed
	global?: boolean;
	internal?: boolean; // event handlers, bindings
	initialised?: boolean; // 变量是否别初始化
	hoistable?: boolean; // 提升变量，非组件实例变量
	subscribable?: boolean; // store变量是否被$订阅
	is_reactive_dependency?: boolean; // 变量是否被$: 表达式引用
	imported?: boolean;
}

export interface CssResult {
	code: string;
	map: SourceMap;
}
