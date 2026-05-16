"use client";

import { useState } from "react";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { Separator } from "@/components/ui/separator";
import { token } from "@/lib/tokens";
import { RfpStagedToolTrace } from "./rfp-report-canvas";
import type { AgentsRfpDemoState } from "../lib/rfp-demo-state";

interface RfpDemoControlsProps {
	state: AgentsRfpDemoState;
	showStagedTrace: boolean;
	onAskRfpHelp: () => void;
	onSubmitQualificationAnswer: () => void;
	onCreateReport: () => void;
	onRefineReport: () => void;
	onApproveReport: () => void;
	onExportPdf: () => void;
	onAttachReport: () => void;
	onCreateAgent: () => void;
	onScheduleAgent: () => void;
	onOpenAgentDetails: () => void;
	onMoveRfp101ToReview: () => void;
	onMoveRfp102ToDrafting: () => void;
	onReset: () => void;
}

function getReportStageLabel(state: AgentsRfpDemoState): string {
	switch (state.report.stage) {
		case "generated":
			return "HTML generated";
		case "refined":
			return "Refined";
		case "approved":
			return "Approved";
		case "pdf-exported":
			return "PDF staged";
		case "attached":
			return "Attached";
		default:
			return "Not started";
	}
}

export function RfpDemoControls({
	state,
	showStagedTrace,
	onAskRfpHelp,
	onSubmitQualificationAnswer,
	onCreateReport,
	onRefineReport,
	onApproveReport,
	onExportPdf,
	onAttachReport,
	onCreateAgent,
	onScheduleAgent,
	onOpenAgentDetails,
	onMoveRfp101ToReview,
	onMoveRfp102ToDrafting,
	onReset,
}: Readonly<RfpDemoControlsProps>): React.ReactElement {
	const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
	const canRefine = state.report.stage === "generated";
	const canApprove = state.report.stage === "generated" || state.report.stage === "refined";
	const canExport = state.report.stage === "approved";
	const canAttach = state.report.stage === "pdf-exported";
	const hasAgent = Boolean(state.agent);
	const hasSchedule = Boolean(state.schedule);
	const handleConfirmReset = () => {
		setIsResetDialogOpen(false);
		onReset();
	};

	return (
		<section
			aria-label="RFP demo controls"
			className="border-y border-border bg-surface"
			style={{ paddingInline: token("space.200"), paddingBlock: token("space.150") }}
		>
			<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
				<div className="min-w-0 space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Lozenge variant="information">RFP-101</Lozenge>
						<Lozenge variant={state.agent ? "success" : "neutral"}>
							{state.agent ? "RFP Drafting Agent ready" : "Rovo selected"}
						</Lozenge>
						<Lozenge variant={state.schedule ? "success" : "neutral"}>
							{state.schedule?.scheduleLabel ?? "No schedule"}
						</Lozenge>
						<Lozenge variant={state.report.stage === "attached" ? "success" : "neutral"}>
							{getReportStageLabel(state)}
						</Lozenge>
						<div className="ml-auto">
							<AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
								<AlertDialogTrigger
									render={
										<Button className="gap-2" size="sm" variant="outline" />
									}
								>
									<RefreshIcon label="" size="small" />
									Reset demo
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Reset demo</AlertDialogTitle>
										<AlertDialogDescription>
											Reset the RFP demo back to its starting state? This clears local demo data for this browser only.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancel</AlertDialogCancel>
										<Button onClick={handleConfirmReset}>Reset demo</Button>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button size="sm" onClick={onAskRfpHelp}>
							Ask Rovo for RFP help
						</Button>
						<Button size="sm" variant="outline" onClick={onSubmitQualificationAnswer}>
							Answer qualification questions
						</Button>
						<Button size="sm" variant="outline" onClick={onCreateReport}>
							Create HTML report
						</Button>
						<Button size="sm" variant="outline" onClick={onRefineReport} disabled={!canRefine}>
							Refine report
						</Button>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button size="sm" variant="outline" onClick={onApproveReport} disabled={!canApprove}>
							Approve report
						</Button>
						<Button size="sm" variant="outline" onClick={onExportPdf} disabled={!canExport}>
							Export PDF
						</Button>
						<Button size="sm" onClick={onAttachReport} disabled={!canAttach}>
							Attach to RFP-101
						</Button>
						<Separator orientation="vertical" className="h-8" />
						<Button size="sm" variant="outline" onClick={onCreateAgent}>
							{hasAgent ? "Reopen RFP Drafting Agent" : "Create RFP Drafting Agent"}
						</Button>
						<Button size="sm" variant="outline" onClick={onScheduleAgent} disabled={!hasAgent || hasSchedule}>
							Schedule weekdays 9:00 AM
						</Button>
						<Button size="sm" variant="outline" onClick={onOpenAgentDetails} disabled={!hasAgent}>
							Agent details
						</Button>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button size="sm" variant="outline" onClick={onMoveRfp101ToReview}>
							Move RFP-101 to Review
						</Button>
						<Button size="sm" variant="outline" onClick={onMoveRfp102ToDrafting}>
							Move RFP-102 to Drafting
						</Button>
					</div>
				</div>

				<div className="min-w-0">
					{showStagedTrace ? (
						<RfpStagedToolTrace />
					) : (
						<div className="grid min-h-24 place-items-center rounded-lg border border-dashed border-border px-4 py-3 text-center text-sm text-text-subtle">
							Staged Jira, attachment, Teamwork Graph, and response-building trace appears after the first RFP prompt.
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
