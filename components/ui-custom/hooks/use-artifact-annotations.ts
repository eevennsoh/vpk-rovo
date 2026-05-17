"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
	appendWithRingBuffer,
	createAnnotationFromSelection,
	formatAnnotationsForVoiceContext,
	reindexAnnotations,
	type ArtifactAnnotation,
	type ArtifactAnnotationAnchor,
	type ArtifactAnnotationKind,
	type ArtifactAnnotationPosition,
	type ArtifactAnnotationSource,
	type PendingArtifactSelection,
} from "@/components/ui-custom/lib/artifact-annotations";

type StackFrame = {
	fileName?: string | null;
	lineNumber?: number | null;
};

type ReactGrabElementContext = {
	componentName: string | null;
	htmlPreview: string;
	selector: string | null;
	stack: StackFrame[];
	stackString: string;
};

type ReactGrabApi = {
	activate?: () => void;
	deactivate?: () => void;
	registerPlugin?: (plugin: {
		name: string;
		hooks?: {
			onElementSelect?: (element: Element) => boolean | void | Promise<boolean>;
		};
	}) => void;
	unregisterPlugin?: (name: string) => void;
	getDisplayName?: (element: Element) => string | null;
	getSource?: (element: Element) => Promise<{
		filePath: string | null;
		lineNumber: number | null;
		componentName: string | null;
	} | null>;
	getStackContext?: (element: Element) => Promise<string>;
};

type ReactGrabWindow = Window & {
	__REACT_GRAB__?: ReactGrabApi;
};

type PointerPosition = {
	clientX: number;
	clientY: number;
};

export interface UseArtifactAnnotationsOptions {
	active: boolean;
	documentId: string | null;
	documentKind: ArtifactAnnotationKind | null;
	documentVersionId: string | null;
	containerRef: RefObject<HTMLDivElement | null>;
}

export interface UseArtifactAnnotationsResult {
	annotations: ArtifactAnnotation[];
	pendingSelection: PendingArtifactSelection | null;
	addComment: (comment: string) => void;
	dismissSelection: () => void;
	removeAnnotation: (id: string) => void;
	clearAnnotations: () => void;
	refreshPositions: () => void;
	formatContextForVoice: () => string;
}

const PLUGIN_NAME = "artifact-annotations";

function isElementInsideContainer(
	element: Element,
	container: HTMLDivElement,
): boolean {
	return container.contains(element);
}

function toTextExcerpt(value: string | null | undefined): string {
	if (typeof value !== "string") {
		return "";
	}

	return value.replace(/\s+/gu, " ").trim().slice(0, 220);
}

function getContainerRelativePosition(
	element: Element,
	container: HTMLDivElement,
): ArtifactAnnotationPosition {
	const elementRect = element.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();

	return {
		top: elementRect.top - containerRect.top + container.scrollTop,
		left: elementRect.left - containerRect.left + container.scrollLeft,
		width: elementRect.width,
		height: elementRect.height,
	};
}

function getCodeLineSelection(element: Element): {
	element: Element;
	lineNumber: number | null;
	lineText: string | null;
	selector: string | null;
} {
	const codeElement = element.closest("code");
	if (!(codeElement instanceof HTMLElement)) {
		return {
			element,
			lineNumber: null,
			lineText: toTextExcerpt(element.textContent),
			selector: null,
		};
	}

	const lineElements = Array.from(codeElement.children).filter((child) => child.tagName === "SPAN");
	const lineIndex = lineElements.findIndex((lineElement) => lineElement.contains(element));

	if (lineIndex === -1) {
		return {
			element,
			lineNumber: null,
			lineText: toTextExcerpt(element.textContent),
			selector: null,
		};
	}

	const lineElement = lineElements[lineIndex] ?? element;
	return {
		element: lineElement,
		lineNumber: lineIndex + 1,
		lineText: toTextExcerpt(lineElement.textContent),
		selector: `pre code > span:nth-child(${lineIndex + 1})`,
	};
}

function getImageSelection(
	element: Element,
	pointerPosition: PointerPosition | null,
): {
	element: HTMLImageElement | Element;
	imagePoint: { x: number; y: number } | null;
	selector: string | null;
	textExcerpt: string;
} {
	const imageElement =
		element instanceof HTMLImageElement
			? element
			: element.closest("img") ?? element.querySelector("img");

	if (!(imageElement instanceof HTMLImageElement)) {
		return {
			element,
			imagePoint: null,
			selector: null,
			textExcerpt: toTextExcerpt(element.textContent),
		};
	}

	const imageRect = imageElement.getBoundingClientRect();
	const fallbackPosition = {
		clientX: imageRect.left + imageRect.width / 2,
		clientY: imageRect.top + imageRect.height / 2,
	};
	const resolvedPointerPosition = pointerPosition ?? fallbackPosition;
	const normalizedX =
		imageRect.width > 0
			? Math.min(Math.max((resolvedPointerPosition.clientX - imageRect.left) / imageRect.width, 0), 1)
			: 0.5;
	const normalizedY =
		imageRect.height > 0
			? Math.min(Math.max((resolvedPointerPosition.clientY - imageRect.top) / imageRect.height, 0), 1)
			: 0.5;

	return {
		element: imageElement,
		imagePoint: {
			x: normalizedX,
			y: normalizedY,
		},
		selector: "img",
		textExcerpt: toTextExcerpt(imageElement.alt) || toTextExcerpt(element.textContent),
	};
}

function resolveSelection(
	element: Element,
	kind: ArtifactAnnotationKind,
	context: ReactGrabElementContext,
	pointerPosition: PointerPosition | null,
): {
	element: Element;
	anchor: ArtifactAnnotationAnchor;
} {
	if (kind === "code") {
		const codeLineSelection = getCodeLineSelection(element);
		return {
			element: codeLineSelection.element,
			anchor: {
				selector: codeLineSelection.selector ?? context.selector,
				textExcerpt: toTextExcerpt(codeLineSelection.lineText ?? element.textContent),
				htmlPreview: context.htmlPreview,
				codeLineNumber: codeLineSelection.lineNumber,
				codeLineText: codeLineSelection.lineText,
			},
		};
	}

	if (kind === "image") {
		const imageSelection = getImageSelection(element, pointerPosition);
		return {
			element: imageSelection.element,
			anchor: {
				selector: imageSelection.selector ?? context.selector,
				textExcerpt: imageSelection.textExcerpt,
				htmlPreview: context.htmlPreview,
				imagePoint: imageSelection.imagePoint,
			},
		};
	}

	return {
		element,
		anchor: {
			selector: context.selector,
			textExcerpt: toTextExcerpt(element.textContent),
			htmlPreview: context.htmlPreview,
		},
	};
}

function resolveSource(
	context: ReactGrabElementContext,
	sourceInfo: Awaited<ReturnType<NonNullable<ReactGrabApi["getSource"]>>>,
	displayName: string | null,
	stackString: string,
): ArtifactAnnotationSource {
	const firstStackFrame = context.stack[0];

	return {
		filePath: sourceInfo?.filePath ?? firstStackFrame?.fileName ?? null,
		lineNumber:
			sourceInfo?.lineNumber
			?? (typeof firstStackFrame?.lineNumber === "number" ? firstStackFrame.lineNumber : null),
		componentName: sourceInfo?.componentName ?? context.componentName ?? displayName ?? null,
		stackString: stackString.trim(),
	};
}

function findLiveAnnotationElement(
	annotation: ArtifactAnnotation,
	container: HTMLDivElement,
): Element | null {
	if (annotation.kind === "image") {
		return container.querySelector(annotation.anchor.selector ?? "img");
	}

	if (!annotation.anchor.selector) {
		return null;
	}

	try {
		return container.querySelector(annotation.anchor.selector);
	} catch {
		return null;
	}
}

function getImagePointPosition(
	imageElement: Element,
	imagePoint: { x: number; y: number },
	container: HTMLDivElement,
): ArtifactAnnotationPosition {
	const imageRect = imageElement.getBoundingClientRect();
	const containerRect = container.getBoundingClientRect();
	const top = imageRect.top - containerRect.top + container.scrollTop + imageRect.height * imagePoint.y;
	const left = imageRect.left - containerRect.left + container.scrollLeft + imageRect.width * imagePoint.x;

	return {
		top,
		left,
		width: 0,
		height: 0,
	};
}

export type { PendingArtifactSelection };

export function useArtifactAnnotations({
	active,
	documentId,
	documentKind,
	documentVersionId,
	containerRef,
}: Readonly<UseArtifactAnnotationsOptions>): UseArtifactAnnotationsResult {
	const [annotations, setAnnotations] = useState<ArtifactAnnotation[]>([]);
	const [pendingSelection, setPendingSelection] = useState<PendingArtifactSelection | null>(null);
	const annotationsRef = useRef<ArtifactAnnotation[]>([]);
	const pointerPositionRef = useRef<PointerPosition | null>(null);

	useEffect(() => {
		annotationsRef.current = annotations;
	}, [annotations]);

	const dismissSelection = useCallback(() => {
		setPendingSelection(null);
	}, []);

	const clearAnnotations = useCallback(() => {
		setAnnotations([]);
		setPendingSelection(null);
	}, []);

	const addComment = useCallback((comment: string) => {
		if (!documentId || !documentKind || !pendingSelection) {
			return;
		}

		const trimmedComment = comment.trim();
		if (!trimmedComment) {
			return;
		}

		setAnnotations((currentAnnotations) =>
			appendWithRingBuffer(
				currentAnnotations,
				createAnnotationFromSelection({
					comment: trimmedComment,
					documentId,
					documentVersionId,
					kind: documentKind,
					pendingSelection,
				}),
			),
		);
		setPendingSelection(null);
	}, [documentId, documentKind, documentVersionId, pendingSelection]);

	const removeAnnotation = useCallback((id: string) => {
		setAnnotations((currentAnnotations) =>
			reindexAnnotations(currentAnnotations.filter((annotation) => annotation.id !== id)),
		);
	}, []);

	const refreshPositions = useCallback(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		setAnnotations((currentAnnotations) =>
			currentAnnotations.map((annotation) => {
				const liveElement = findLiveAnnotationElement(annotation, container);

				if (liveElement && annotation.kind === "image" && annotation.anchor.imagePoint) {
					return {
						...annotation,
						position: getImagePointPosition(liveElement, annotation.anchor.imagePoint, container),
					};
				}

				if (liveElement) {
					return {
						...annotation,
						position: getContainerRelativePosition(liveElement, container),
					};
				}

				return annotation;
			}),
		);
	}, [containerRef]);

	const formatContextForVoice = useCallback(() => {
		return formatAnnotationsForVoiceContext(annotationsRef.current);
	}, []);

	useEffect(() => {
		if (!active) {
			return;
		}

		const container = containerRef.current;
		if (!container) {
			return;
		}

		const handlePointerEvent = (event: PointerEvent) => {
			pointerPositionRef.current = {
				clientX: event.clientX,
				clientY: event.clientY,
			};
		};

		container.addEventListener("pointerdown", handlePointerEvent, true);
		container.addEventListener("pointermove", handlePointerEvent, true);

		return () => {
			container.removeEventListener("pointerdown", handlePointerEvent, true);
			container.removeEventListener("pointermove", handlePointerEvent, true);
		};
	}, [active, containerRef]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || annotationsRef.current.length === 0) {
			return;
		}

		const handleScroll = () => {
			refreshPositions();
		};

		container.addEventListener("scroll", handleScroll, { passive: true });

		if (typeof ResizeObserver === "undefined") {
			return () => {
				container.removeEventListener("scroll", handleScroll);
			};
		}

		const resizeObserver = new ResizeObserver(() => {
			refreshPositions();
		});
		resizeObserver.observe(container);

		const imageElement = container.querySelector("img");
		if (imageElement instanceof HTMLElement) {
			resizeObserver.observe(imageElement);
		}

		return () => {
			container.removeEventListener("scroll", handleScroll);
			resizeObserver.disconnect();
		};
	}, [annotations.length, containerRef, refreshPositions]);

	useEffect(() => {
		if (!active || !documentId || !documentKind || typeof window === "undefined") {
			setPendingSelection(null);
			return;
		}

		let activeApi: ReactGrabApi | null = null;
		let cancelled = false;

		const plugin = {
			name: PLUGIN_NAME,
			hooks: {
				onElementSelect: async (element: Element) => {
					const container = containerRef.current;
					if (!container || !isElementInsideContainer(element, container)) {
						return false;
					}

					if (element.closest("[data-artifact-annotation-ui]")) {
						return true;
					}

					try {
						const { getElementContext } = await import("react-grab/primitives");
						const context = (await getElementContext(element)) as ReactGrabElementContext;
						const selection = resolveSelection(
							element,
							documentKind,
							context,
							pointerPositionRef.current,
						);
						const sourceInfo = await activeApi?.getSource?.(selection.element);
						const stackString =
							context.stackString
							|| (await activeApi?.getStackContext?.(selection.element))
							|| "";
						const source = resolveSource(
							context,
							sourceInfo ?? null,
							activeApi?.getDisplayName?.(selection.element) ?? null,
							stackString,
						);

						setPendingSelection({
							element: selection.element,
							anchor: selection.anchor,
							source,
							position: getContainerRelativePosition(selection.element, container),
						});
					} catch (error) {
						console.error("[ArtifactAnnotations] Failed to capture selection", error);
					}

					return true;
				},
			},
		};

		const registerPlugin = (api: ReactGrabApi) => {
			if (cancelled) {
				return;
			}

			activeApi = api;
			api.activate?.();
			api.registerPlugin?.(plugin);
		};

		const handleReactGrabInit = (event: Event) => {
			const customEvent = event as CustomEvent<ReactGrabApi>;
			if (customEvent.detail) {
				registerPlugin(customEvent.detail);
			}
		};

		const reactGrabApi = (window as ReactGrabWindow).__REACT_GRAB__;
		if (reactGrabApi) {
			registerPlugin(reactGrabApi);
		} else {
			window.addEventListener("react-grab:init", handleReactGrabInit);
		}

		return () => {
			cancelled = true;
			window.removeEventListener("react-grab:init", handleReactGrabInit);
			activeApi?.unregisterPlugin?.(PLUGIN_NAME);
			activeApi?.deactivate?.();
			setPendingSelection(null);
		};
	}, [active, containerRef, documentId, documentKind]);

	return {
		annotations,
		pendingSelection,
		addComment,
		dismissSelection,
		removeAnnotation,
		clearAnnotations,
		refreshPositions,
		formatContextForVoice,
	};
}
