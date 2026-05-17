"use client";

import {
	Attachment,
	AttachmentInfo,
	AttachmentPreview,
	AttachmentRemove,
	Attachments,
} from "@/components/ui-custom/attachments";
import { usePromptInputAttachments } from "@/components/ui-custom/prompt-input";

export function PendingAttachments() {
	const attachments = usePromptInputAttachments();

	if (attachments.files.length === 0) {
		return null;
	}

	return (
		<Attachments variant="inline" className="mb-3 justify-start">
			{attachments.files.map((file) => (
				<Attachment
					key={file.id}
					data={file}
					onRemove={() => attachments.remove(file.id)}
				>
					<AttachmentPreview />
					<AttachmentInfo />
					<AttachmentRemove className="opacity-100" />
				</Attachment>
			))}
		</Attachments>
	);
}
