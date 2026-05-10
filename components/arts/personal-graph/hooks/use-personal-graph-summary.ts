"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamLibrarian, streamPersonalGraphSummarize } from "../lib/personal-graph-api";
import type { LibrarianStreamEvent, PersonalGraphSummaryLength } from "../lib/personal-graph-types";

export type PersonalGraphSummaryStatus = "idle" | "running" | "done" | "error";
export type PersonalGraphDeckStatus = "idle" | "running" | "done" | "error";
export type PersonalGraphConfirmStatus = "idle" | "running" | "done" | "error";

function createSummaryClientId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function usePersonalGraphSummary(nodeId: string | null) {
	const abortRef = useRef<AbortController | null>(null);
	const clientIdRef = useRef("");
	const [deck, setDeck] = useState("");
	const [deckStatus, setDeckStatus] = useState<PersonalGraphDeckStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [confirmEvents, setConfirmEvents] = useState<LibrarianStreamEvent[]>([]);
	const [confirmStatus, setConfirmStatus] = useState<PersonalGraphConfirmStatus>("idle");
	const [length, setLength] = useState<PersonalGraphSummaryLength>("medium");
	const [stage, setStage] = useState("");
	const [status, setStatus] = useState<PersonalGraphSummaryStatus>("idle");
	const [summary, setSummary] = useState("");
	const [takeaways, setTakeaways] = useState<string[]>([]);

	const abort = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	const reset = useCallback(() => {
		abort();
		setDeck("");
		setDeckStatus("idle");
		setError(null);
		setConfirmEvents([]);
		setConfirmStatus("idle");
		setStage("");
		setStatus("idle");
		setSummary("");
		setTakeaways([]);
	}, [abort]);

	useEffect(() => {
		reset();
	}, [nodeId, reset]);

	useEffect(() => abort, [abort]);

	const generateSummary = useCallback(async (nextLength: PersonalGraphSummaryLength) => {
		if (!nodeId) return;
		clientIdRef.current ||= createSummaryClientId();
		abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setDeck("");
		setDeckStatus("idle");
		setError(null);
		setLength(nextLength);
		setStage("starting");
		setStatus("running");
		setSummary("");
		setTakeaways([]);

		try {
			for await (const event of streamPersonalGraphSummarize(
				{ action: "summary", clientId: clientIdRef.current, length: nextLength, nodeId },
				{ signal: controller.signal },
			)) {
				if (event.type === "stage") {
					setStage(event.stage);
				}
				if (event.type === "summary") {
					setSummary(event.summary);
					setTakeaways(event.takeaways);
					setStatus("done");
					setStage(event.stage);
				}
				if (event.type === "error") {
					setError(event.error);
					setStatus("error");
					setStage(event.stage);
				}
			}
		} catch (nextError) {
			if (controller.signal.aborted) {
				return;
			}
			setError(nextError instanceof Error ? nextError.message : String(nextError));
			setStatus("error");
			setStage("error");
		} finally {
			if (abortRef.current === controller) {
				abortRef.current = null;
			}
		}
	}, [abort, nodeId]);

	const generateDeck = useCallback(async () => {
		if (!nodeId || !summary) return;
		clientIdRef.current ||= createSummaryClientId();
		abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setDeck("");
		setDeckStatus("running");
		setError(null);

		try {
			for await (const event of streamPersonalGraphSummarize(
				{ action: "deck", clientId: clientIdRef.current, length, nodeId, summary, takeaways },
				{ signal: controller.signal },
			)) {
				if (event.type === "deck") {
					setDeck(event.deck);
					setDeckStatus("done");
				}
				if (event.type === "error") {
					setError(event.error);
					setDeckStatus("error");
				}
			}
		} catch (nextError) {
			if (controller.signal.aborted) {
				return;
			}
			setError(nextError instanceof Error ? nextError.message : String(nextError));
			setDeckStatus("error");
		} finally {
			if (abortRef.current === controller) {
				abortRef.current = null;
			}
		}
	}, [abort, length, nodeId, summary, takeaways]);

	const confirm = useCallback(async (sourcePath: string, onDone?: () => void) => {
		if (!summary) return;
		setConfirmEvents([]);
		setConfirmStatus("running");
		setError(null);
		try {
			for await (const event of streamLibrarian({
				sourcePath,
				summaryOverride: { summary, takeaways },
			})) {
				setConfirmEvents((current) => [...current, event]);
				if (event.type === "done") {
					setConfirmStatus("done");
					onDone?.();
				}
				if (event.type === "error") {
					setConfirmStatus("error");
					setError(event.error);
				}
			}
		} catch (nextError) {
			setConfirmStatus("error");
			setError(nextError instanceof Error ? nextError.message : String(nextError));
		}
	}, [summary, takeaways]);

	return {
		confirm,
		confirmEvents,
		confirmStatus,
		deck,
		deckStatus,
		error,
		generateDeck,
		generateSummary,
		length,
		reset,
		stage,
		status,
		summary,
		takeaways,
	};
}
