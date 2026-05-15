"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Badge } from "@/components/ui/badge";
import { useWorkItemData, type WorkItemAttachment } from "@/app/contexts/context-work-item-modal";
import AddIcon from "@atlaskit/icon/core/add";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";


const ATTACHMENT_FILES: WorkItemAttachment[] = [
	{ name: "automotive-itsm-rfp-requirements", ext: "pdf", date: "12 Aug 2025, 09:12 AM", thumbnailTone: "success" },
	{ name: "rfp-requirement-compliance-matrix", ext: "xlsx", date: "12 Aug 2025, 09:18 AM", thumbnailTone: "warning" },
	{ name: "pricing-tco-and-license-model", ext: "xlsx", date: "2 Sep 2025, 04:10 PM", thumbnailTone: "discovery" },
];

interface AttachmentCardProps {
	file: WorkItemAttachment;
}

function getAttachmentColor(file: WorkItemAttachment): string {
	if (file.thumbnailColor) return file.thumbnailColor;
	switch (file.thumbnailTone) {
		case "success":
			return token("color.background.success");
		case "warning":
			return token("color.background.warning");
		case "discovery":
			return token("color.background.discovery");
		case "information":
			return token("color.background.information");
		default:
			return token("elevation.surface.sunken");
	}
}

function AttachmentCard({ file }: Readonly<AttachmentCardProps>) {
	return (
		<div
			style={{
				width: "160px",
				flexShrink: 0,
				borderRadius: token("radius.medium"),
				overflow: "hidden",
				boxShadow: token("elevation.shadow.raised"),
			}}
		>
			<div style={{ height: "88px", backgroundColor: getAttachmentColor(file) }} />
			<div style={{ padding: token("space.050"), backgroundColor: token("elevation.surface") }}>
				<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
					<span className="text-xs font-bold">
						{file.name}.{file.ext}
					</span>
				</div>
				<div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
					<span className="text-xs text-text">
						{file.date}
					</span>
				</div>
			</div>
		</div>
	);
}

export function AttachmentsSection() {
	const workItem = useWorkItemData();
	const attachmentFiles = workItem.attachments?.length ? workItem.attachments : ATTACHMENT_FILES;

	return (
		<div style={{ marginBottom: token("space.300") }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: token("space.100"),
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: token("space.050") }}>
					<Heading size="small" as="h3">
						Attachments
					</Heading>
					<Badge>{attachmentFiles.length}</Badge>
				</div>
				<div style={{ display: "flex", gap: token("space.100") }}>
					<Button aria-label="Manage" size="icon-sm" variant="ghost">
						<ShowMoreHorizontalIcon label="" size="small" />
					</Button>
					<Button aria-label="Add attachment" size="icon-sm" variant="ghost">
						<AddIcon label="" size="small" />
					</Button>
				</div>
			</div>

			<div
				style={{
					display: "flex",
					gap: token("space.050"),
					overflowX: "auto",
					padding: token("space.025"),
				}}
			>
				{attachmentFiles.map((file, i) => (
					<AttachmentCard key={i} file={file} />
				))}
			</div>
		</div>
	);
}
