"use client";

import { createContext, use, useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type RefObject } from "react";
import { createPortal } from "react-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger, createHoverCardHandle, type HoverCardProps, type HoverCardTriggerProps } from "@/components/ui/hover-card";
import { useConeFamily } from "./cone-safezone/use-cone-family";
import { useConeHoverIntent } from "./cone-safezone/use-cone-hover-intent";
import { useConeDebug } from "./cone-safezone/use-cone-debug";
import type { ConePolygon } from "./cone-safezone/geometry";
import { cn } from "@/lib/utils";

interface ConeContextValue {
	handle: object;
	registerTrigger: (element: Element) => () => void;
	debug: boolean;
	popupRef: RefObject<HTMLDivElement | null>;
	intentRef: RefObject<HTMLDivElement | null>;
	onPreviewOpenChange: (id: string, open: boolean) => void;
}

const ConeContext = createContext<ConeContextValue | null>(null);

export type ConeSafezoneProps<Payload = unknown> = HoverCardProps<Payload> & {
	/** Maximum pause while traversing the cone, in milliseconds. */
	graceMs?: number;
	/** Persistently draw the cursor-to-destination cone while open. Never intercepts input. */
	debug?: boolean;
};

/** HoverCard composition with bidirectional pointer intent and nested popup retention. */
export function ConeSafezone<Payload = unknown>({
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	handle: externalHandle,
	triggerId,
	defaultTriggerId,
	graceMs = 300,
	debug: debugProp,
	children,
	...props
}: Readonly<ConeSafezoneProps<Payload>>) {
	const parent = use(ConeContext);
	const debug = debugProp ?? parent?.debug ?? false;
	const id = useId();
	const [internalHandle] = useState(() => createHoverCardHandle<Payload>());
	const handle = externalHandle ?? internalHandle;
	const triggers = useRef(new Set<Element>());
	const registerTrigger = useCallback((element: Element) => {
		triggers.current.add(element);
		return () => { triggers.current.delete(element); };
	}, []);
	const getActiveTrigger = useCallback(() => {
		const id = triggerId ?? defaultTriggerId;
		if (id) return document.getElementById(id);
		return Array.from(triggers.current).find((element) => element.hasAttribute("data-popup-open"))
			?? (triggers.current.size === 1 ? triggers.current.values().next().value ?? null : null);
	}, [triggerId, defaultTriggerId]);
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [cone, setCone] = useState<ConePolygon | null>(null);
	const open = controlledOpen ?? internalOpen;
	const close = useCallback(() => handle.close(), [handle]);
	const commitOpen: NonNullable<HoverCardProps<Payload>["onOpenChange"]> = (nextOpen, details) => {
		onOpenChange?.(nextOpen, details);
		if (!details.isCanceled) setInternalOpen(nextOpen);
	};
	const family = useConeFamily(handle, commitOpen, getActiveTrigger);
	const intent = useConeHoverIntent(open, family.onOpenChange, close, Math.max(0, graceMs), getActiveTrigger);
	useConeDebug(open, intent.getDebugCone, debug ? setCone : undefined);
	const registerWithParent = parent?.onPreviewOpenChange;
	useEffect(() => {
		registerWithParent?.(id, open);
		return () => registerWithParent?.(id, false);
	}, [id, open, registerWithParent]);
	const context = useMemo(() => ({
		handle,
		registerTrigger,
		debug,
		popupRef: family.popupRef,
		intentRef: intent.popupRef,
		onPreviewOpenChange: family.onPreviewOpenChange,
	}), [handle, registerTrigger, debug, family.popupRef, intent.popupRef, family.onPreviewOpenChange]);

	return (
		<ConeContext value={context}>
			<HoverCard<Payload> {...props} handle={handle} triggerId={triggerId} defaultTriggerId={defaultTriggerId} open={open} onOpenChange={intent.onOpenChange}>
				{children}
			</HoverCard>
			{debug && open && cone ? createPortal(
				<svg aria-hidden="true" data-cone-safezone-debug="" className="pointer-events-none fixed inset-0 z-[500] h-full w-full overflow-visible text-border-selected">
					<polygon points={cone.map(({ x, y }) => `${x},${y}`).join(" ")} fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1} />
				</svg>,
				document.body,
			) : null}
		</ConeContext>
	);
}

export type ConeSafezoneContentProps = ComponentProps<typeof HoverCardContent>;

export function ConeSafezoneTrigger<Payload = unknown>({ ref, ...props }: Readonly<HoverCardTriggerProps<Payload>>) {
	const context = use(ConeContext);
	const register = !props.handle || props.handle === context?.handle ? context?.registerTrigger : undefined;
	const setRef = useCallback((element: HTMLAnchorElement | null) => {
		if (!element) return;
		const unregister = register?.(element);
		const cleanup = typeof ref === "function" ? ref(element) : undefined;
		if (ref && typeof ref !== "function") ref.current = element;
		return () => {
			unregister?.();
			if (typeof cleanup === "function") cleanup();
			else if (typeof ref === "function") ref(null);
			else if (ref) ref.current = null;
		};
	}, [register, ref]);
	return <HoverCardTrigger<Payload> {...props} ref={setRef} />;
}

export function ConeSafezoneContent({ ref, className, ...props }: Readonly<ConeSafezoneContentProps>) {
	const context = use(ConeContext);
	const setRef = useCallback((element: HTMLDivElement | null) => {
		if (!context) return;
		context.popupRef.current = element;
		context.intentRef.current = element;
		if (typeof ref === "function") return ref(element);
		if (ref) ref.current = element;
	}, [context, ref]);
	if (!context) throw new Error("ConeSafezoneContent must be inside ConeSafezone.");
	return <HoverCardContent {...props} className={cn("max-w-[calc(100vw-32px)]", className)} ref={setRef} />;
}

export {
	HoverCardViewport as ConeSafezoneViewport,
	createHoverCardHandle as createConeSafezoneHandle,
	type HoverCardHandle as ConeSafezoneHandle,
} from "@/components/ui/hover-card";
