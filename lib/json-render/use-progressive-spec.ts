"use client";

import { useEffect, useState } from "react";
import type { Spec } from "@json-render/react";

interface UseProgressiveSpecResult {
	progressiveSpec: Spec | null;
	isProgressing: boolean;
}

function getTraversalKeys(spec: Spec): string[] {
	const keys: string[] = [];
	const visited = new Set<string>();
	const elements = spec.elements ?? {};

	const visit = (key: string) => {
		if (!key || visited.has(key)) return;
		visited.add(key);
		keys.push(key);
		const element = elements[key];
		if (element?.children) {
			for (const childKey of element.children) {
				if (childKey.trim().length > 0) {
					visit(childKey);
				}
			}
		}
	};

	visit(spec.root);
	for (const key of Object.keys(elements)) {
		visit(key);
	}

	return keys;
}

/**
 * Progressively builds a Spec by adding elements one at a time using
 * depth-first traversal order. The root and first child element are
 * batched immediately, then remaining elements are added per animation
 * frame with a configurable interval.
 *
 * When progressing completes, the original spec reference is returned
 * so downstream memo comparisons work correctly.
 */
export function useProgressiveSpec(
	spec: Spec | null,
	enabled = true,
	intervalMs = 40,
): UseProgressiveSpecResult {
	const [progressiveSpec, setProgressiveSpec] = useState<Spec | null>(null);
	const [isProgressing, setIsProgressing] = useState(false);

	useEffect(() => {
		if (!spec || !enabled) {
			setProgressiveSpec(spec);
			setIsProgressing(false);
			return;
		}

		const traversalKeys = getTraversalKeys(spec);

		// Small specs render immediately — no progressive benefit
		if (traversalKeys.length <= 3) {
			setProgressiveSpec(spec);
			setIsProgressing(false);
			return;
		}

		let cancelled = false;
		setIsProgressing(true);

		// Batch 1: root element + first child (minimally valid spec)
		const initialElements: Spec["elements"] = {};
		const batchSize = Math.min(2, traversalKeys.length);
		for (let i = 0; i < batchSize; i++) {
			const key = traversalKeys[i];
			if (key && spec.elements[key]) {
				initialElements[key] = spec.elements[key];
			}
		}

		setProgressiveSpec({
			root: spec.root,
			elements: initialElements,
			// Include state from the start so JSONUIProvider initializes correctly
			...(spec.state !== undefined ? { state: spec.state } : {}),
		} as Spec);

		// Schedule remaining elements one per frame
		let index = batchSize;
		let frameId: number | null = null;
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		const scheduleNext = () => {
			if (cancelled) return;

			if (index >= traversalKeys.length) {
				// Done — return the original spec reference (includes state)
				setProgressiveSpec(spec);
				setIsProgressing(false);
				return;
			}

			const key = traversalKeys[index];
			index++;

			setProgressiveSpec((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					elements: {
						...prev.elements,
						[key]: spec.elements[key],
					},
				} as Spec;
			});

			frameId = requestAnimationFrame(() => {
				frameId = null;
				timeoutId = setTimeout(() => {
					timeoutId = null;
					scheduleNext();
				}, intervalMs);
			});
		};

		frameId = requestAnimationFrame(() => {
			frameId = null;
			timeoutId = setTimeout(() => {
				timeoutId = null;
				scheduleNext();
			}, intervalMs);
		});

		return () => {
			cancelled = true;
			if (frameId !== null) {
				cancelAnimationFrame(frameId);
			}
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
	}, [spec, enabled, intervalMs]);

	return { progressiveSpec, isProgressing };
}
