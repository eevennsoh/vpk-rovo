"use client";

import {
	createContext,
	use,
	useCallback,
	useMemo,
	useState,
	type ReactNode,
} from "react";

import type { FailingChecksComposerChipItem } from "@/components/ui-custom/failing-checks-composer-chip";

export type FailingCheckComposerItem = FailingChecksComposerChipItem;

export interface StageFailingChecksOptions {
	/** Demo agent prompt to populate the activity composer draft. */
	prompt?: string;
}

type FailingChecksComposerContextValue = {
	checks: readonly FailingCheckComposerItem[];
	/** Increments on each successful stage so the sticky activity composer can focus. */
	focusRequestKey: number;
	/** Last prompt staged with Fix / Fix all (for draft + empty-submit fallback). */
	promptPrefill: string | null;
	/** Merge failing checks into the composer chip (dedupe by id). */
	stageChecks: (
		checks: readonly FailingCheckComposerItem[],
		options?: StageFailingChecksOptions,
	) => void;
	removeAll: () => void;
};

const FailingChecksComposerContext = createContext<FailingChecksComposerContextValue | null>(null);

/**
 * Holds failing CI checks attached to the sticky work-item activity composer as
 * a one-turn pill — same PromptInput chip path as Activity / Code Review comments.
 */
export function FailingChecksComposerProvider({
	children,
}: Readonly<{ children: ReactNode }>) {
	const [checks, setChecks] = useState<readonly FailingCheckComposerItem[]>([]);
	const [focusRequestKey, setFocusRequestKey] = useState(0);
	const [promptPrefill, setPromptPrefill] = useState<string | null>(null);

	const stageChecks = useCallback((
		nextChecks: readonly FailingCheckComposerItem[],
		options?: StageFailingChecksOptions,
	) => {
		if (nextChecks.length === 0) {
			return;
		}
		setChecks((current) => {
			const byId = new Map(current.map((check) => [check.id, check]));
			for (const check of nextChecks) {
				byId.set(check.id, check);
			}
			return [...byId.values()];
		});
		if (typeof options?.prompt === "string" && options.prompt.trim()) {
			setPromptPrefill(options.prompt);
		}
		setFocusRequestKey((current) => current + 1);
	}, []);

	const removeAll = useCallback(() => {
		setChecks([]);
		setPromptPrefill(null);
	}, []);

	const value = useMemo(
		() => ({ checks, focusRequestKey, promptPrefill, stageChecks, removeAll }),
		[checks, focusRequestKey, promptPrefill, removeAll, stageChecks],
	);

	return (
		<FailingChecksComposerContext value={value}>
			{children}
		</FailingChecksComposerContext>
	);
}

export function useFailingChecksComposer(): FailingChecksComposerContextValue {
	const context = use(FailingChecksComposerContext);
	if (context === null) {
		throw new Error("useFailingChecksComposer must be used within FailingChecksComposerProvider");
	}
	return context;
}
