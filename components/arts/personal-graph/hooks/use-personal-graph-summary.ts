"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { streamPersonalGraphSummarize } from "../lib/personal-graph-api";
import type {
	PersonalGraphSummaryLength,
	VaultExplorer,
	VaultNode,
} from "../lib/personal-graph-types";
import {
	buildPersonalGraphSummaryHtmlDocument,
	getPersonalGraphSummaryHtmlContext,
	type PersonalGraphSummaryHtmlDocument,
} from "../personal-graph-summary-html";

export type PersonalGraphSummaryStatus = "idle" | "running" | "done" | "error";

interface GenerateSummaryOptions {
	bypassCache?: boolean;
	workWindow?: string | null;
}

function createSummaryClientId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getExplorerRevision(explorer: VaultExplorer | null, node: VaultNode | null) {
	return [
		explorer?.generatedAt ?? "no-explorer",
		node?.id ?? "no-node",
		node?.updatedAt ?? "no-updated-at",
		node?.connectionCount ?? 0,
	].join(":");
}

export function usePersonalGraphSummary(node: VaultNode | null, explorer: VaultExplorer | null) {
	const abortRef = useRef<AbortController | null>(null);
	const clientIdRef = useRef("");
	const explorerRef = useRef<VaultExplorer | null>(explorer);
	const nodeRef = useRef<VaultNode | null>(node);
	const [articleMarkdown, setArticleMarkdown] = useState("");
	const [cacheStatus, setCacheStatus] = useState<"hit" | "miss" | "bypass" | null>(null);
	const [document, setDocument] = useState<PersonalGraphSummaryHtmlDocument | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [errorCode, setErrorCode] = useState<string | null>(null);
	const [length, setLength] = useState<PersonalGraphSummaryLength>("medium");
	const [sourceFingerprint, setSourceFingerprint] = useState("");
	const [sourceNotice, setSourceNotice] = useState<string | null>(null);
	const [stage, setStage] = useState("");
	const [status, setStatus] = useState<PersonalGraphSummaryStatus>("idle");
	const resetKey = getExplorerRevision(explorer, node);

	useEffect(() => {
		explorerRef.current = explorer;
	}, [explorer]);

	useEffect(() => {
		nodeRef.current = node;
	}, [node]);

	const abort = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
	}, []);

	const reset = useCallback(() => {
		abort();
		setArticleMarkdown("");
		setCacheStatus(null);
		setDocument(null);
		setError(null);
		setErrorCode(null);
		setSourceFingerprint("");
		setSourceNotice(null);
		setStage("");
		setStatus("idle");
	}, [abort]);

	useEffect(() => {
		reset();
	}, [reset, resetKey]);

	useEffect(() => abort, [abort]);

	const generateSummary = useCallback(async (
		nextLength: PersonalGraphSummaryLength,
		options: GenerateSummaryOptions = {},
	) => {
		const currentNode = nodeRef.current;
		if (!currentNode) return;
		clientIdRef.current ||= createSummaryClientId();
		abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setArticleMarkdown("");
		setCacheStatus(null);
		setDocument(null);
		setError(null);
		setErrorCode(null);
		setLength(nextLength);
		setSourceFingerprint("");
		setSourceNotice(null);
		setStage("starting");
		setStatus("running");

		try {
			for await (const event of streamPersonalGraphSummarize(
				{
					action: "summary",
					bypassCache: options.bypassCache,
					clientId: clientIdRef.current,
					length: nextLength,
					nodeId: currentNode.id,
					workWindow: options.workWindow,
				},
				{ signal: controller.signal },
			)) {
				if (event.type === "stage") {
					setStage(event.stage);
				}
				if (event.type === "article") {
					const summaryContext = getPersonalGraphSummaryHtmlContext(explorerRef.current, currentNode);
					const generatedAt = new Date().toISOString();
					const nextDocument = buildPersonalGraphSummaryHtmlDocument({
						articleMarkdown: event.articleMarkdown,
						edges: summaryContext.edges,
						generatedAt,
						length: event.length,
						neighbors: summaryContext.neighbors,
						node: currentNode,
						provider: event.source,
						sourceFingerprint: event.sourceFingerprint,
						sourceNotice: event.sourceNotice,
						workWindow: event.workWindow,
					});
					setArticleMarkdown(event.articleMarkdown);
					setCacheStatus(event.cache);
					setDocument(nextDocument);
					setSourceFingerprint(event.sourceFingerprint);
					setSourceNotice(event.sourceNotice ?? null);
					setStatus("done");
					setStage("done");
				}
				if (event.type === "error") {
					setError(event.error);
					setErrorCode(event.code ?? null);
					setStatus("error");
					setStage(event.stage);
				}
			}
		} catch (nextError) {
			if (controller.signal.aborted) {
				return;
			}
			setError(nextError instanceof Error ? nextError.message : String(nextError));
			setErrorCode(null);
			setStatus("error");
			setStage("error");
		} finally {
			if (abortRef.current === controller) {
				abortRef.current = null;
			}
		}
	}, [abort]);

	return {
		articleMarkdown,
		cacheStatus,
		error,
		errorCode,
		exportFilename: document?.filename ?? "",
		generateSummary,
		length,
		reset,
		sourceFingerprint,
		sourceNotice,
		stage,
		status,
		summaryHtml: document?.html ?? "",
		title: document?.title ?? "",
	};
}
