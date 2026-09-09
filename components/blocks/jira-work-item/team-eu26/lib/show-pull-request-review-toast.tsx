"use client";

import { toast } from "sonner";

import type { PullRequestReviewVerdict } from "@/components/blocks/pull-request-review";
import { SONNER_TOAST_AUTO_DISMISS_MS, SonnerToast } from "@/components/ui/sonner";

import {
	mapReviewVerdictToToastCopy,
	PULL_REQUEST_REVIEW_TOASTER_ID,
} from "./pull-request-review-submit";

/** Fire the PR-review success toast on the work-item toaster. */
export function showPullRequestReviewToast(verdict: PullRequestReviewVerdict): void {
	const copy = mapReviewVerdictToToastCopy(verdict);
	toast.custom(
		(toastId) => (
			<SonnerToast
				appearance={copy.appearance}
				dismissible
				onDismiss={() => {
					toast.dismiss(toastId);
				}}
				title={copy.title}
			/>
		),
		{
			duration: SONNER_TOAST_AUTO_DISMISS_MS,
			toasterId: PULL_REQUEST_REVIEW_TOASTER_ID,
		},
	);
}
