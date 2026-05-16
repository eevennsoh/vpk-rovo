"use client";

import Image from "next/image";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo } from "@/components/ui/logo";
import { useWorkItemModal, type WorkItemAttachment } from "@/app/contexts/context-work-item-modal";
import {
	FileChartColumnIcon,
	FileIcon,
	ImageIcon,
	MoreHorizontalIcon,
	Music2Icon,
	PlusIcon,
	VideoIcon,
} from "@/components/ui/vpk-icons";

const ATTACHMENT_ICON_CLASS_NAME = "size-3 text-icon-subtlest [&_svg]:size-3";
const ATTACHMENT_SOURCE_LABELS = {
	confluence: "Confluence",
	loom: "Loom",
} as const;

const ATTACHMENT_FILES: WorkItemAttachment[] = [
	{
		name: "enterprise-rfp-requirements",
		ext: "pdf",
		date: "12 Aug 2025, 09:12 AM",
		thumbnailKind: "file",
		thumbnailTone: "success",
	},
	{
		name: "rfp-requirement-compliance-matrix",
		ext: "xlsx",
		date: "12 Aug 2025, 09:18 AM",
		thumbnailKind: "document",
		thumbnailTone: "warning",
	},
	{
		name: "pricing-tco-and-license-model",
		ext: "xlsx",
		date: "2 Sep 2025, 04:10 PM",
		thumbnailKind: "document",
		thumbnailTone: "discovery",
	},
];

interface AttachmentCardProps {
	file: WorkItemAttachment;
	onOpen?: (file: WorkItemAttachment) => void;
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

function getAttachmentTitle(file: WorkItemAttachment): string {
	return file.displayName ?? `${file.name}.${file.ext}`;
}

function renderAttachmentIcon(file: WorkItemAttachment) {
	if (file.sourceProduct) {
		return (
			<AtlassianLogo
				name={file.sourceProduct}
				label={file.sourceLabel ?? ATTACHMENT_SOURCE_LABELS[file.sourceProduct]}
				size={"12" as "xxsmall"}
			/>
		);
	}

	if (file.ext === "xlsx" || file.ext === "csv") {
		return <FileChartColumnIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
	}

	switch (file.thumbnailKind) {
		case "audio":
			return <Music2Icon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
		case "image":
			return <ImageIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
		case "video":
			return <VideoIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
		default:
			return <FileIcon className={ATTACHMENT_ICON_CLASS_NAME} size={12} />;
	}
}

function renderAttachmentPreview(file: WorkItemAttachment, title: string) {
	if (file.thumbnailKind === "audio") {
		return (
			<div className="flex h-full w-full items-center justify-center bg-surface-sunken">
				<IconTile
					aria-hidden={true}
					icon={<Music2Icon />}
					label="Audio attachment"
					variant="redBold"
					size="medium"
				/>
			</div>
		);
	}

	if (file.previewSrc) {
		return (
			<Image
				alt={file.previewAlt ?? title}
				className="object-cover"
				src={file.previewSrc}
				fill={true}
				sizes="(min-width: 768px) 25vw, 50vw"
			/>
		);
	}

	return null;
}

function AttachmentCard({ file, onOpen }: Readonly<AttachmentCardProps>) {
	const title = getAttachmentTitle(file);
	const canOpenPreview = Boolean(file.previewKind && onOpen);
	const containerStyle = {
		minWidth: 0,
		borderRadius: token("radius.medium"),
		overflow: "hidden",
		boxShadow: token("elevation.shadow.raised"),
		backgroundColor: token("elevation.surface"),
		cursor: canOpenPreview ? "pointer" : undefined,
	};
	const cardContent = (
		<>
			<div
				style={{
					position: "relative",
					height: "104px",
					backgroundColor: file.previewSrc ? "transparent" : getAttachmentColor(file),
				}}
			>
				{renderAttachmentPreview(file, title)}
			</div>
			<div className="flex min-w-0 items-center gap-2" style={{ padding: token("space.075") }}>
				<div
					className="min-w-0 flex-1"
					style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
					title={title}
				>
					<span className="text-xs font-normal">
						{title}
					</span>
				</div>
				{renderAttachmentIcon(file)}
			</div>
		</>
	);

	if (canOpenPreview) {
		return (
			<button
				type="button"
				onClick={() => onOpen?.(file)}
				className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				style={containerStyle}
			>
				{cardContent}
			</button>
		);
	}

	return (
		<div style={containerStyle}>
			{cardContent}
		</div>
	);
}

export function AttachmentsSection() {
	const { meta } = useWorkItemModal();
	const workItem = meta.workItem;
	const attachmentFiles = workItem.attachments?.length ? workItem.attachments : ATTACHMENT_FILES;

	return (
		<section
			style={{
				display: "grid",
				rowGap: token("space.100"),
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: token("space.100") }}>
					<Heading size="small" as="h3">
						Attachments
					</Heading>
					<Badge>{attachmentFiles.length}</Badge>
				</div>
				<div style={{ display: "flex", gap: token("space.100") }}>
					<Button aria-label="Manage" size="icon-sm" variant="ghost">
						<MoreHorizontalIcon size="small" />
					</Button>
					<Button aria-label="Add attachment" size="icon-sm" variant="ghost">
						<PlusIcon size="small" />
					</Button>
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(172px, 1fr))",
					gap: token("space.100"),
					padding: token("space.025"),
				}}
			>
				{attachmentFiles.map((file, i) => (
					<AttachmentCard
						key={file.id ?? `${file.name}-${i}`}
						file={file}
						onOpen={meta.onAttachmentOpen}
					/>
				))}
			</div>
		</section>
	);
}
