import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import { JIRA_DROPZONE_ANTS_STROKE_CLASS } from "./lib/jira-dropzone-ants";

export function JiraDropzoneAntsStroke({
	selected,
}: Readonly<{
	selected: boolean;
}>): ReactElement {
	return (
		<svg
			aria-hidden
			className="pointer-events-none absolute inset-0 size-full overflow-visible"
			data-jira-dropzone-ants-stroke=""
			height="100%"
			width="100%"
		>
			<rect
				className={cn(
					JIRA_DROPZONE_ANTS_STROKE_CLASS,
					selected ? "stroke-border-selected" : "stroke-border",
				)}
			/>
		</svg>
	);
}
