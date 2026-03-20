"use client";

import { useMemo } from "react";
import { autoFixSpec, validateSpec } from "@json-render/core";
import type { Spec } from "@json-render/react";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "./registry";
import { normalizeBoardLayoutSpec } from "./spec-normalization";

const ROOT_STACK_PADDING_UNITS = 0;

function hasRenderableShape(spec: Spec | null): spec is Spec {
	if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
		return false;
	}

	if (typeof spec.root !== "string" || spec.root.trim().length === 0) {
		return false;
	}

	if (
		!spec.elements ||
		typeof spec.elements !== "object" ||
		Array.isArray(spec.elements) ||
		Object.keys(spec.elements).length === 0
	) {
		return false;
	}

	return true;
}

function normalizeRootStackPadding(spec: Spec): Spec {
	if (!hasRenderableShape(spec)) {
		return spec;
	}

	const rootKey = spec.root;
	const rootElement = spec.elements[rootKey];
	if (!rootElement) {
		return spec;
	}

	if (rootElement.type !== "Stack") {
		return spec;
	}

	const rawPadding = rootElement.props?.padding;
	if (typeof rawPadding !== "number" || !Number.isFinite(rawPadding)) {
		return spec;
	}

	const normalizedPadding = Math.max(
		0,
		Math.min(Math.round(rawPadding), ROOT_STACK_PADDING_UNITS)
	);

	if (normalizedPadding === rawPadding) {
		return spec;
	}

	const nextRootElement = {
		...rootElement,
		props: {
			...rootElement.props,
			padding: normalizedPadding,
		},
	};

	return {
		...spec,
		elements: {
			...spec.elements,
			[rootKey]: nextRootElement,
		},
	};
}

function normalizeRenderableSpec(spec: Spec): Spec {
	return normalizeBoardLayoutSpec(normalizeRootStackPadding(spec));
}

function toRenderableSpec(spec: Spec | null): Spec | null {
	if (!hasRenderableShape(spec)) {
		return null;
	}

	try {
		const normalizedSpec = normalizeRenderableSpec(spec);
		const validation = validateSpec(normalizedSpec);
		if (validation.valid) {
			return normalizedSpec;
		}

		const fixed = autoFixSpec(normalizedSpec);
		if (!hasRenderableShape(fixed.spec as Spec)) {
			return null;
		}

		const normalizedFixedSpec = normalizeRenderableSpec(fixed.spec as Spec);
		const fixedValidation = validateSpec(normalizedFixedSpec);
		return fixedValidation.valid ? normalizedFixedSpec : null;
	} catch {
		return null;
	}
}

interface JsonRenderViewProps {
	spec: Spec | null;
	loading?: boolean;
	skipValidation?: boolean;
	onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void;
	handlers?: Record<
		string,
		(params: Record<string, unknown>) => Promise<unknown> | unknown
	>;
}

export function JsonRenderView({
	spec,
	loading,
	skipValidation,
	onStateChange,
	handlers,
}: Readonly<JsonRenderViewProps>) {
	const renderableSpec = useMemo(() => {
		if (skipValidation) {
			return hasRenderableShape(spec)
				? normalizeRenderableSpec(spec)
				: null;
		}
		return toRenderableSpec(spec);
	}, [spec, skipValidation]);
	if (!renderableSpec) {
		return null;
	}

	return (
		<JSONUIProvider
			registry={registry}
			initialState={renderableSpec.state}
			onStateChange={onStateChange}
			handlers={handlers}
		>
			<Renderer spec={renderableSpec} registry={registry} loading={loading} />
		</JSONUIProvider>
	);
}
