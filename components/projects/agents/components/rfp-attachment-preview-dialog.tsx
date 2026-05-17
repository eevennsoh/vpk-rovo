"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Lozenge } from "@/components/ui/lozenge";
import type { WorkItemAttachment } from "@/app/contexts/context-work-item-modal";

interface RfpAttachmentPreviewDialogProps {
	attachment: WorkItemAttachment | null;
	onOpenChange: (open: boolean) => void;
}

export function RfpAttachmentPreviewDialog({
	attachment,
	onOpenChange,
}: Readonly<RfpAttachmentPreviewDialogProps>): React.ReactElement {
	const open = attachment?.previewKind === "pdf-preview";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size="md">
				<DialogHeader>
					<div className="flex flex-wrap items-center gap-2">
						<DialogTitle>{attachment?.displayName ?? "RFP response strategy.pdf"}</DialogTitle>
						<Lozenge variant="neutral">Staged PDF</Lozenge>
					</div>
					<DialogDescription>
						Browser-local preview for the staged export. No file was generated or downloaded.
					</DialogDescription>
				</DialogHeader>

				<div className="grid min-h-[320px] place-items-center rounded-lg border border-border bg-surface-raised p-6 text-center">
					<div className="grid max-w-sm gap-3">
						<div className="mx-auto grid size-14 place-items-center rounded-lg bg-surface text-2xl font-semibold text-text-subtle shadow-sm">
							PDF
						</div>
						<div>
							<p className="text-sm font-semibold text-text">RFP response strategy</p>
							<p className="mt-1 text-sm text-text-subtle">
								Approved HTML report staged as a PDF attachment entry for RFP-101.
							</p>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
