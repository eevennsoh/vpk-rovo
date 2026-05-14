"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Badge } from "@/components/ui/badge";
import AddIcon from "@atlaskit/icon/core/add";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";


interface AttachmentFile {
	name: string;
	ext: string;
	date: string;
	color: string;
}

const ATTACHMENT_FILES: AttachmentFile[] = [
	{ name: "Background001", ext: "png", date: "17 Mar 2025, 09:12 AM", color: token("color.background.success") },
	{ name: "NewerBackground001", ext: "png", date: "17 Mar 2025, 09:12 AM", color: token("color.background.warning") },
	{ name: "Background002", ext: "png", date: "17 Mar 2025, 09:12 AM", color: token("color.background.discovery") },
];

interface AttachmentCardProps {
	file: AttachmentFile;
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
			<div style={{ height: "88px", backgroundColor: file.color }} />
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
					<Badge>5</Badge>
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
				{ATTACHMENT_FILES.map((file, i) => (
					<AttachmentCard key={i} file={file} />
				))}
			</div>
		</div>
	);
}
