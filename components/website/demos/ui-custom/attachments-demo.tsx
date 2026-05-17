"use client";

import Image from "next/image";
import {
	Attachments,
	Attachment,
	AttachmentPreview,
	AttachmentInfo,
	AttachmentRemove,
	AttachmentHoverCard,
	AttachmentHoverCardTrigger,
	AttachmentHoverCardContent,
	AttachmentEmpty,
} from "@/components/ui-custom/attachments";
import type { AttachmentData } from "@/components/ui-custom/attachments";

// ============================================================================
// Sample data
// ============================================================================

const SAMPLE_IMAGE: AttachmentData = {
	id: "1",
	type: "file",
	mediaType: "image/png",
	filename: "screenshot.png",
	url: "https://picsum.photos/seed/vpk-attach-1/400/300",
};

const SAMPLE_PDF: AttachmentData = {
	id: "2",
	type: "file",
	mediaType: "application/pdf",
	filename: "quarterly-report.pdf",
	url: "",
};

const SAMPLE_VIDEO: AttachmentData = {
	id: "3",
	type: "file",
	mediaType: "video/mp4",
	filename: "demo-recording.mp4",
	url: "",
};

const SAMPLE_SOURCE: AttachmentData = {
	id: "4",
	type: "source-document",
	sourceId: "src-1",
	mediaType: "text/html",
	title: "Atlassian Design System",
	filename: "atlassian.design",
	providerMetadata: {},
};

const SAMPLE_AUDIO: AttachmentData = {
	id: "5",
	type: "file",
	mediaType: "audio/mpeg",
	filename: "podcast-episode.mp3",
	url: "",
};

const SAMPLE_IMAGE_2: AttachmentData = {
	id: "6",
	type: "file",
	mediaType: "image/jpeg",
	filename: "architecture-diagram.jpg",
	url: "https://picsum.photos/seed/vpk-attach-2/400/300",
};

const ALL_FILES: AttachmentData[] = [
	SAMPLE_IMAGE,
	SAMPLE_PDF,
	SAMPLE_VIDEO,
	SAMPLE_SOURCE,
	SAMPLE_AUDIO,
	SAMPLE_IMAGE_2,
];

const IMAGE_FILES: AttachmentData[] = [SAMPLE_IMAGE, SAMPLE_IMAGE_2];

// ============================================================================
// Default demo — Grid with images
// ============================================================================

export default function AttachmentsDemo() {
	return (
		<Attachments variant="grid">
			{IMAGE_FILES.map((file) => (
				<Attachment key={file.id} data={file} onRemove={() => {}}>
					<AttachmentPreview />
					<AttachmentRemove />
				</Attachment>
			))}
		</Attachments>
	);
}

// ============================================================================
// Grid variant — mixed file types with remove
// ============================================================================

export function AttachmentsDemoGrid() {
	return (
		<Attachments variant="grid">
			{ALL_FILES.slice(0, 4).map((file) => (
				<Attachment key={file.id} data={file} onRemove={() => {}}>
					<AttachmentPreview />
					<AttachmentRemove />
				</Attachment>
			))}
		</Attachments>
	);
}

// ============================================================================
// Inline variant — compact badges with info
// ============================================================================

export function AttachmentsDemoInline() {
	return (
		<Attachments variant="inline">
			{ALL_FILES.slice(0, 3).map((file) => (
				<Attachment key={file.id} data={file} onRemove={() => {}}>
					<AttachmentPreview />
					<AttachmentInfo />
					<AttachmentRemove />
				</Attachment>
			))}
		</Attachments>
	);
}

// ============================================================================
// List variant — full rows with media type
// ============================================================================

export function AttachmentsDemoList() {
	return (
		<Attachments variant="list">
			{ALL_FILES.slice(0, 4).map((file) => (
				<Attachment key={file.id} data={file} onRemove={() => {}}>
					<AttachmentPreview />
					<AttachmentInfo showMediaType />
					<AttachmentRemove />
				</Attachment>
			))}
		</Attachments>
	);
}

// ============================================================================
// Hover card — inline with hover preview
// ============================================================================

export function AttachmentsDemoHoverCard() {
	return (
		<Attachments variant="inline">
			{IMAGE_FILES.map((file) => (
				<AttachmentHoverCard key={file.id}>
					<Attachment data={file}>
						<AttachmentHoverCardTrigger>
							<AttachmentPreview />
							<AttachmentInfo />
						</AttachmentHoverCardTrigger>
					</Attachment>
					<AttachmentHoverCardContent>
							<Image
								alt={file.filename ?? "Preview"}
								className="max-h-48 rounded object-contain"
								src={(file as { url: string }).url}
								width={400}
								height={300}
								unoptimized
							/>
					</AttachmentHoverCardContent>
				</AttachmentHoverCard>
			))}
		</Attachments>
	);
}

// ============================================================================
// Read-only — no remove buttons
// ============================================================================

export function AttachmentsDemoReadOnly() {
	return (
		<Attachments variant="grid">
			{IMAGE_FILES.map((file) => (
				<Attachment key={file.id} data={file}>
					<AttachmentPreview />
				</Attachment>
			))}
		</Attachments>
	);
}

// ============================================================================
// Empty state
// ============================================================================

export function AttachmentsDemoEmpty() {
	return (
		<Attachments variant="grid">
			<AttachmentEmpty />
		</Attachments>
	);
}
