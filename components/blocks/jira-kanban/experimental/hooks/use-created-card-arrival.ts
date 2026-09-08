"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type RefCallback,
} from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import { subscribeCreatedCardBottomReveal } from "@/components/blocks/jira-create/lib/jira-create-column-scroll";

export interface JiraKanbanCreatedCardArrival {
	readonly id: number;
	readonly columnTitle: string;
	readonly cardCodes: readonly string[];
	/**
	 * Whether the cards landed at the end of the column. The create well always
	 * appends, so the column follows the last card's bottom (chin included). A
	 * gap drop lands mid-column, already under the pointer, and must not yank
	 * the column away.
	 */
	readonly appended: boolean;
}

const JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS = 600; // duration-slowest

export function useBoardCreatedCardArrival({
	captureSession,
	onCreate,
}: Readonly<{
	captureSession: (session: AgentSessionItem) => void;
	onCreate?: (
		session: AgentSessionItem,
		columnTitle: string,
		insertAtIndex?: number,
	) => string | undefined;
}>) {
	const [createdCardArrival, setCreatedCardArrival] = useState<JiraKanbanCreatedCardArrival | null>(null);
	const createdCardArrivalIdRef = useRef(0);

	const handleCreate = useCallback((
		session: AgentSessionItem,
		columnTitle: string,
		insertAtIndex?: number,
	) => {
		if (onCreate === undefined) return;

		captureSession(session);
		const cardCode = onCreate(session, columnTitle, insertAtIndex);
		if (cardCode === undefined) return;

		const appended = insertAtIndex === undefined;
		createdCardArrivalIdRef.current += 1;
		const id = createdCardArrivalIdRef.current;
		setCreatedCardArrival((current) => (
			current?.columnTitle === columnTitle
				? { id, columnTitle, cardCodes: [...current.cardCodes, cardCode], appended }
				: { id, columnTitle, cardCodes: [cardCode], appended }
		));
	}, [captureSession, onCreate]);

	const handleComplete = useCallback((arrivalId: number) => {
		setCreatedCardArrival((current) => current?.id === arrivalId ? null : current);
	}, []);

	return { createdCardArrival, handleComplete, handleCreate };
}

export function useCreatedCardArrivalCompletion(
	onComplete: ((arrivalId: number) => void) | undefined,
	holdMs: number = JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS,
): (arrivalId: number) => void {
	const completedIdsRef = useRef(new Set<number>());
	const holdTimeoutRef = useRef<number | null>(null);

	useEffect(() => () => {
		if (holdTimeoutRef.current !== null) {
			window.clearTimeout(holdTimeoutRef.current);
		}
	}, []);

	return useCallback((arrivalId: number) => {
		if (completedIdsRef.current.has(arrivalId)) return;
		completedIdsRef.current.add(arrivalId);
		if (holdTimeoutRef.current !== null) {
			window.clearTimeout(holdTimeoutRef.current);
			holdTimeoutRef.current = null;
		}
		if (holdMs <= 0) {
			onComplete?.(arrivalId);
			return;
		}
		holdTimeoutRef.current = window.setTimeout(() => {
			holdTimeoutRef.current = null;
			onComplete?.(arrivalId);
		}, holdMs);
	}, [holdMs, onComplete]);
}

export function useCreatedCardArrivalScroll({
	arrival,
	cardCount,
	onCardListRef,
	title,
}: Readonly<{
	arrival?: JiraKanbanCreatedCardArrival;
	cardCount: number;
	onCardListRef: RefCallback<HTMLDivElement>;
	title: string;
}>): RefCallback<HTMLDivElement> {
	const cardListElementRef = useRef<HTMLDivElement | null>(null);
	const setCardListRef = useCallback((node: HTMLDivElement | null) => {
		cardListElementRef.current = node;
		onCardListRef(node);
	}, [onCardListRef]);

	useLayoutEffect(() => {
		if (
			arrival === undefined
			|| arrival.columnTitle !== title
			|| arrival.cardCodes.length === 0
			// A gap drop lands where the pointer already is; following the new
			// group's bottom would pull the card out from under the user.
			|| !arrival.appended
		) return;

		const cardList = cardListElementRef.current;
		if (cardList === null) return;
		const arrivedCards = [...cardList.querySelectorAll<HTMLElement>(
			`[data-created-card-arrival-id="${arrival.id}"]`,
		)];
		if (arrivedCards.length < arrival.cardCodes.length) return;

		// Follow the last arriving card's bottom as the slot grows so the chin
		// stays on screen. Observing the scrollport itself would miss that growth.
		return subscribeCreatedCardBottomReveal(cardList, arrivedCards);
	}, [arrival, cardCount, title]);

	return setCardListRef;
}
