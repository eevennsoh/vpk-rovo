"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
	type RefObject,
} from "react";

import {
	CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
	createExclusiveProximityScheduler,
	resolveExclusiveProximityWinner,
} from "@/components/blocks/jira-kanban/experimental/lib/create-work-item-exclusive-proximity";

interface ExclusiveCreateWellEntry {
	getRect: () => { bottom: number; left: number; right: number; top: number } | null;
	id: string;
}

interface ExclusiveCreateWellProximityValue {
	register: (id: string, getRect: ExclusiveCreateWellEntry["getRect"]) => () => void;
	winnerId: string | null;
}

const ExclusiveCreateWellProximityContext = createContext<ExclusiveCreateWellProximityValue | null>(null);

export function ExclusiveCreateWellProximityProvider({
	children,
	hoverArea = CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
}: Readonly<{
	children: ReactNode;
	hoverArea?: number;
}>) {
	const wellsRef = useRef<ExclusiveCreateWellEntry[]>([]);
	const [winnerId, setWinnerId] = useState<string | null>(null);

	const register = useCallback((id: string, getRect: ExclusiveCreateWellEntry["getRect"]) => {
		const entry = { getRect, id };
		wellsRef.current = [...wellsRef.current, entry];
		return () => {
			wellsRef.current = wellsRef.current.filter((well) => well !== entry);
		};
	}, []);

	useEffect(() => {
		if (typeof document === "undefined") return;

		const scheduler = createExclusiveProximityScheduler({
			requestFrame: (callback) => window.requestAnimationFrame(callback),
			cancelFrame: (id) => window.cancelAnimationFrame(id),
			onClear: () => setWinnerId(null),
			onPointer(pointer) {
				const wells = wellsRef.current.flatMap((well) => {
					const rect = well.getRect();
					if (!rect || rect.right <= rect.left || rect.bottom <= rect.top) return [];
					return [{ id: well.id, rect }];
				});
				setWinnerId(resolveExclusiveProximityWinner(pointer, wells, hoverArea));
			},
		});
		const handleMove = (event: PointerEvent) => {
			scheduler.move({ x: event.clientX, y: event.clientY }, event.pointerType);
		};
		const handleOut = (event: PointerEvent) => {
			if (event.relatedTarget === null) scheduler.clear();
		};

		document.addEventListener("pointermove", handleMove, { passive: true });
		document.addEventListener("pointerout", handleOut, { passive: true });
		document.addEventListener("pointercancel", scheduler.clear, { passive: true });
		window.addEventListener("blur", scheduler.clear);
		return () => {
			document.removeEventListener("pointermove", handleMove);
			document.removeEventListener("pointerout", handleOut);
			document.removeEventListener("pointercancel", scheduler.clear);
			window.removeEventListener("blur", scheduler.clear);
			scheduler.dispose();
		};
	}, [hoverArea]);

	const value = useMemo(
		() => ({ register, winnerId }),
		[register, winnerId],
	);

	return (
		<ExclusiveCreateWellProximityContext value={value}>
			{children}
		</ExclusiveCreateWellProximityContext>
	);
}

export function useExclusiveCreateWellProximity(
	id: string,
	targetRef: RefObject<HTMLElement | null>,
): boolean {
	const coordinator = use(ExclusiveCreateWellProximityContext);
	const register = coordinator?.register;

	useEffect(() => {
		if (!register) return;
		return register(id, () => targetRef.current?.getBoundingClientRect() ?? null);
	}, [register, id, targetRef]);

	return coordinator ? coordinator.winnerId === id : true;
}
