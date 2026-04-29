"use client";

import { useCallback, useState } from "react";
import { streamLibrarian } from "../lib/personal-graph-api";
import type { LibrarianStreamEvent, QmdResult } from "../lib/personal-graph-types";

export function useLibrarianStream(onDone?: () => void) {
	const [events, setEvents] = useState<LibrarianStreamEvent[]>([]);
	const [related, setRelated] = useState<QmdResult[]>([]);
	const [status, setStatus] = useState<"idle" | "running" | "awaiting-confirmation" | "done" | "error">("idle");
	const [takeaways, setTakeaways] = useState<string[]>([]);
	const [token, setToken] = useState<string | null>(null);

	const consume = useCallback(async (body: { confirmToken?: string; sourcePath?: string }) => {
		setStatus("running");
		for await (const event of streamLibrarian(body)) {
			setEvents((current) => [...current, event]);
			if (event.type === "summary") setTakeaways(event.takeaways);
			if (event.type === "related") setRelated(event.related);
			if (event.type === "confirmation") {
				setToken(event.token);
				setStatus("awaiting-confirmation");
			}
			if (event.type === "done") {
				setStatus("done");
				onDone?.();
			}
			if (event.type === "error") setStatus("error");
		}
	}, [onDone]);

	return {
		confirm: () => token ? consume({ confirmToken: token }) : Promise.resolve(),
		discard: () => {
			setStatus("idle");
			setToken(null);
		},
		events,
		related,
		start: (sourcePath: string) => consume({ sourcePath }),
		status,
		takeaways,
		token,
	};
}
