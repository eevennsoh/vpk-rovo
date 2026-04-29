"use client";

import { useEffect, useState } from "react";
import { searchVault } from "../lib/personal-graph-api";
import type { QmdResult } from "../lib/personal-graph-types";

export function useVaultSearch(query: string) {
	const [results, setResults] = useState<QmdResult[]>([]);
	const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setStatus("idle");
			return;
		}
		const controller = new AbortController();
		const timeout = window.setTimeout(() => {
			setStatus("loading");
			void searchVault(query, { signal: controller.signal })
				.then((nextResults) => {
					setResults(nextResults);
					setStatus("ready");
				})
				.catch((error) => {
					if (error instanceof Error && error.name === "AbortError") return;
					setStatus("error");
				});
		}, 200);
		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	}, [query]);

	return { results, status };
}
