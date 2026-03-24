import { formatDistanceToNow } from "date-fns";
import type {
	FutureChatDocument,
	FutureChatDocumentVersion,
} from "@/lib/future-chat-types";

export function getFutureChatVersionNumber(
	document: Pick<FutureChatDocument, "versions">,
	versionId: string,
): number {
	const versionIndex = document.versions.findIndex((version) => version.id === versionId);
	return versionIndex === -1 ? document.versions.length : versionIndex + 1;
}

export function getFutureChatVersionTitle(options: {
	document: Pick<FutureChatDocument, "title">;
	version: Pick<FutureChatDocumentVersion, "title"> | null;
}): string {
	return options.version?.title ?? options.document.title;
}

export function formatFutureChatVersionLabel(options: {
	document: Pick<FutureChatDocument, "versions">;
	referenceDate?: Date;
	version: Pick<FutureChatDocumentVersion, "changeLabel" | "createdAt" | "id">;
}): string {
	const versionNumber = getFutureChatVersionNumber(
		options.document,
		options.version.id,
	);
	const relativeTime = formatDistanceToNow(
		new Date(options.version.createdAt),
		{
			addSuffix: true,
			...(options.referenceDate
				? { now: options.referenceDate.getTime() }
				: {}),
		},
	);

	return `Version ${versionNumber} • ${options.version.changeLabel} • ${relativeTime}`;
}
