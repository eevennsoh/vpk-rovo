/**
 * Generates a standalone React component file from a json-render spec.
 * Uses @json-render/codegen for tree traversal and prop serialization.
 */

import type { Spec } from "@json-render/core";
import {
	collectUsedComponents,
	serializeProps,
} from "@json-render/codegen";

// Map json-render catalog types to VPK import paths
const IMPORT_MAP: Record<string, { module: string; named?: boolean }> = {
	// Layout
	Stack: { module: "@/components/ui/stack", named: true },
	Card: { module: "@/components/ui/card", named: true },
	Grid: { module: "@/components/ui/grid", named: true },
	ScrollArea: { module: "@/components/ui/scroll-area", named: true },
	Carousel: { module: "@/components/ui/carousel", named: true },

	// Typography
	Heading: { module: "@/components/ui/heading", named: true },
	Text: { module: "@/components/ui/text", named: true },

	// Data display
	Badge: { module: "@/components/ui/badge", named: true },
	Alert: { module: "@/components/ui/alert", named: true },
	Table: { module: "@/components/ui/table", named: true },
	Avatar: { module: "@/components/ui/avatar", named: true },
	Separator: { module: "@/components/ui/separator", named: true },
	Image: { module: "next/image" },

	// Charts
	BarChart: { module: "recharts", named: true },
	LineChart: { module: "recharts", named: true },
	PieChart: { module: "recharts", named: true },
	AreaChart: { module: "recharts", named: true },

	// Interactive
	Tabs: { module: "@/components/ui/tabs", named: true },
	Button: { module: "@/components/ui/button", named: true },
	Checkbox: { module: "@/components/ui/checkbox", named: true },
	Switch: { module: "@/components/ui/switch", named: true },
	Slider: { module: "@/components/ui/slider", named: true },
	Progress: { module: "@/components/ui/progress", named: true },
	Accordion: { module: "@/components/ui/accordion", named: true },
	Dialog: { module: "@/components/ui/dialog", named: true },
	Tooltip: { module: "@/components/ui/tooltip", named: true },

	// Inputs
	TextInput: { module: "@/components/ui/input", named: true },
	TextArea: { module: "@/components/ui/textarea", named: true },
	SelectInput: { module: "@/components/ui/select", named: true },
	RadioGroup: { module: "@/components/ui/radio-group", named: true },
};

function buildImports(usedComponents: Set<string>): string {
	const moduleMap = new Map<string, Set<string>>();

	for (const comp of usedComponents) {
		const mapping = IMPORT_MAP[comp];
		if (!mapping) continue;

		const existing = moduleMap.get(mapping.module) ?? new Set();
		existing.add(comp);
		moduleMap.set(mapping.module, existing);
	}

	const lines: string[] = [];
	for (const [mod, components] of moduleMap) {
		const names = Array.from(components).sort();
		lines.push(`import { ${names.join(", ")} } from "${mod}";`);
	}

	return lines.join("\n");
}

function elementToJsx(
	key: string,
	elements: Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }>,
	indent = 1,
): string {
	const el = elements[key];
	if (!el) return "";

	const pad = "\t".repeat(indent);
	const { type, props = {}, children = [] } = el;

	// Filter out null/undefined props and dynamic expressions
	const staticProps: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(props)) {
		if (v == null) continue;
		if (typeof v === "object" && ("$state" in (v as Record<string, unknown>) || "$bindState" in (v as Record<string, unknown>))) {
			staticProps[k] = `{/* TODO: bind to state */}`;
			continue;
		}
		staticProps[k] = v;
	}

	const propsStr = serializeProps(staticProps).trim();
	const propsFragment = propsStr ? ` ${propsStr}` : "";

	if (children.length === 0) {
		return `${pad}<${type}${propsFragment} />`;
	}

	const childJsx = children
		.map((childKey) => elementToJsx(childKey, elements, indent + 1))
		.filter(Boolean)
		.join("\n");

	return `${pad}<${type}${propsFragment}>\n${childJsx}\n${pad}</${type}>`;
}

export interface CodegenOptions {
	componentName?: string;
}

export function generateReactCode(spec: Spec, options: CodegenOptions = {}): string {
	const name = options.componentName ?? "GeneratedUI";
	const usedComponents = collectUsedComponents(spec);
	const imports = buildImports(usedComponents);

	const elements = spec.elements as Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }>;
	const jsx = elementToJsx(spec.root, elements);

	const stateEntries = spec.state
		? Object.entries(spec.state as Record<string, unknown>)
				.map(([key, val]) => `\tconst [${key}, set${key.charAt(0).toUpperCase() + key.slice(1)}] = useState(${JSON.stringify(val)});`)
				.join("\n")
		: "";

	const needsState = Boolean(spec.state && Object.keys(spec.state as object).length > 0);

	const lines: string[] = [
		`"use client";`,
		``,
		`import { ${needsState ? "useState" : ""} } from "react";`,
		imports,
		``,
		`export function ${name}() {`,
	];

	if (stateEntries) {
		lines.push(stateEntries);
		lines.push(``);
	}

	lines.push(`\treturn (`);
	lines.push(jsx);
	lines.push(`\t);`);
	lines.push(`}`);
	lines.push(``);

	return lines.join("\n");
}
