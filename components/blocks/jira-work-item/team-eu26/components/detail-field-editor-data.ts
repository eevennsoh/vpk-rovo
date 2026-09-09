import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import type { LozengeProps } from "@/components/ui/lozenge";
import type { RichTextSuggestionMenuItem } from "@/components/ui-custom/rich-text-editor";

export type PriorityValue = NonNullable<WorkItemData["priority"]>;
type LozengeVariant = NonNullable<LozengeProps["variant"]>;

export const STATUS_PHASES: readonly string[] = BOARD_COLUMNS.map((column) => column.title);
export const PRIORITY_OPTIONS: readonly PriorityValue[] = ["Highest", "High", "Medium", "Low", "Lowest"];

/** Named tones so trigger + menu lozenges stay matched across board workflows. */
const NAMED_STATUS_VARIANTS: Readonly<Record<string, LozengeVariant>> = {
	"To do": "neutral",
	"RFP Intake": "neutral",
	"In progress": "information",
	Drafting: "information",
	"In review": "information",
	Review: "information",
	Done: "success",
	Submitted: "success",
};

export function statusVariant(
	status: string,
	phases: readonly string[] = STATUS_PHASES,
): LozengeVariant {
	const named = NAMED_STATUS_VARIANTS[status];
	if (named) {
		return named;
	}
	const index = phases.indexOf(status);
	if (index < 0) {
		return "neutral";
	}
	if (index === phases.length - 1) {
		return "success";
	}
	if (index === 0) {
		return "neutral";
	}
	return "information";
}

/** Activity-feed status chip using the same tone map as the status dropdown. */
export function statusLozengeSegment(
	status: string,
	phases: readonly string[] = STATUS_PHASES,
): { type: "lozenge"; text: string; variant: LozengeVariant } {
	return {
		type: "lozenge",
		text: status,
		variant: statusVariant(status, phases),
	};
}

export function filterMetadataSearchItems(
	items: readonly RichTextSuggestionMenuItem[],
	query: string,
): readonly RichTextSuggestionMenuItem[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) => {
		const haystack = `${item.label} ${item.description ?? ""}`.toLowerCase();
		return haystack.includes(normalizedQuery);
	});
}
