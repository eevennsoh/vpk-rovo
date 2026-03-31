"use client";

import { ToolApproval, type ToolApprovalSubmitDecision } from "@/components/blocks/tool-approval";
import { BATCH_TOOL_APPROVAL_DEMO, SINGLE_TOOL_APPROVAL_DEMO } from "@/components/blocks/tool-approval/data/demo-approvals";
import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

interface ToolApprovalDemoSurfaceProps {
	initialToolApproval: ToolApprovalPayload;
	forceSubmitting?: boolean;
}

function ToolApprovalDemoSurface({
	initialToolApproval,
	forceSubmitting = false,
}: Readonly<ToolApprovalDemoSurfaceProps>): ReactElement {
	const timeoutRef = useRef<number | null>(null);
	const [toolApproval, setToolApproval] = useState<ToolApprovalPayload | null>(() => initialToolApproval);
	const [isSubmitting, setIsSubmitting] = useState(() => forceSubmitting);

	useEffect(() => {
		return () => {
			if (timeoutRef.current !== null) {
				window.clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	function submitApproval(
		payload: ToolApprovalPayload,
		decisions: ToolApprovalSubmitDecision[],
	) {
		if (forceSubmitting) {
			return;
		}

		const isComplete = decisions.length === payload.items.length;

		setIsSubmitting(true);
		if (timeoutRef.current !== null) {
			window.clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = window.setTimeout(() => {
			setIsSubmitting(false);
			if (!isComplete) {
				timeoutRef.current = null;
				return;
			}

			setToolApproval(null);
			timeoutRef.current = window.setTimeout(() => {
				setToolApproval(initialToolApproval);
				timeoutRef.current = null;
			}, 450);
		}, 700);
	}

	return (
		<div className="flex items-center justify-center bg-background p-6">
			<div className="w-full max-w-[800px]">
				{toolApproval ? (
					<ToolApproval
						isSubmitting={isSubmitting}
						onSubmit={submitApproval}
						progressMode="remaining"
						submissionMode="per-decision"
						toolApproval={toolApproval}
					/>
				) : null}
			</div>
		</div>
	);
}

export default function ToolApprovalPreview(): ReactElement {
	return (
		<ToolApprovalDemoSurface
			initialToolApproval={SINGLE_TOOL_APPROVAL_DEMO}
		/>
	);
}

export function ToolApprovalDemoBatch(): ReactElement {
	return (
		<ToolApprovalDemoSurface
			initialToolApproval={BATCH_TOOL_APPROVAL_DEMO}
		/>
	);
}

export function ToolApprovalDemoSubmitting(): ReactElement {
	return (
		<ToolApprovalDemoSurface
			forceSubmitting
			initialToolApproval={SINGLE_TOOL_APPROVAL_DEMO}
		/>
	);
}
