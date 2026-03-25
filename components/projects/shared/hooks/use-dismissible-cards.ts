"use client";

import { useCallback, useState } from "react";
import {
	getQuestionCardResolutionKey,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";

interface UseDismissibleCardsOptions {
	activeQuestionCard: ParsedQuestionCardPayload | null;
	scopeKey?: string | null;
	onDismissQuestionCard?: (
		questionCard: ParsedQuestionCardPayload,
	) => boolean | Promise<boolean> | void;
}

interface UseDismissibleCardsReturn {
	shouldShowQuestionCard: boolean;
	activeQuestionCardKey: string | null;
	hideQuestionCard: () => void;
	dismissQuestionCard: () => void;
}

function deriveQuestionCardKey(card: ParsedQuestionCardPayload | null): string | null {
	return getQuestionCardResolutionKey(card);
}

export function useDismissibleCards({
	activeQuestionCard,
	scopeKey = null,
	onDismissQuestionCard,
}: Readonly<UseDismissibleCardsOptions>): UseDismissibleCardsReturn {
	const [dismissedQuestionCardByScope, setDismissedQuestionCardByScope] = useState<
		Record<string, string | null>
	>({});
	const resolvedScopeKey = scopeKey ?? "__default__";
	const dismissedQuestionCardKey = dismissedQuestionCardByScope[resolvedScopeKey] ?? null;

	const activeQuestionCardKey = deriveQuestionCardKey(activeQuestionCard);

	const shouldShowQuestionCard =
		activeQuestionCard !== null && dismissedQuestionCardKey !== activeQuestionCardKey;

	const hideQuestionCard = useCallback(() => {
		setDismissedQuestionCardByScope((previousState) => ({
			...previousState,
			[resolvedScopeKey]: activeQuestionCardKey,
		}));
	}, [activeQuestionCardKey, resolvedScopeKey]);

	const dismissQuestionCard = useCallback(() => {
		void (async () => {
			let shouldDismiss = true;
			if (activeQuestionCard) {
				try {
					const dismissResult = await onDismissQuestionCard?.(activeQuestionCard);
					shouldDismiss = dismissResult !== false;
				} catch (error) {
					console.warn(
						"[dismissible-cards] Failed to dismiss question card:",
						error,
					);
					shouldDismiss = false;
				}
			}

			if (!shouldDismiss) {
				return;
			}

			setDismissedQuestionCardByScope((previousState) => ({
				...previousState,
				[resolvedScopeKey]: activeQuestionCardKey,
			}));
		})();
	}, [
		activeQuestionCardKey,
		activeQuestionCard,
		onDismissQuestionCard,
		resolvedScopeKey,
	]);

	return {
		shouldShowQuestionCard,
		activeQuestionCardKey,
		hideQuestionCard,
		dismissQuestionCard,
	};
}
