"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import { resolveJiraDropzoneCollapseMs } from "./lib/jira-dropzone-receipts";
import type { JiraDropzonePhase } from "./lib/jira-dropzone-types";

export function useJiraDropzoneCollapseHold(phase: JiraDropzonePhase): boolean {
	const shouldReduceMotion = useReducedMotion();
	const [holdingOpen, setHoldingOpen] = useState(false);
	const isOpenPhase = phase !== "resting";

	useLayoutEffect(() => {
		if (isOpenPhase) {
			setHoldingOpen(true);
		}
	}, [isOpenPhase]);

	useEffect(() => {
		if (isOpenPhase || !holdingOpen) {
			return;
		}
		const timer = window.setTimeout(() => {
			setHoldingOpen(false);
		}, resolveJiraDropzoneCollapseMs(shouldReduceMotion));
		return () => {
			window.clearTimeout(timer);
		};
	}, [holdingOpen, isOpenPhase, shouldReduceMotion]);

	return holdingOpen;
}
