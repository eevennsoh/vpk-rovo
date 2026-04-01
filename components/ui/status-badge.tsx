"use client";

import { cn } from "@/lib/utils";
import { getWorkflowStatusPresentation } from "@/lib/workflow-status";

export interface StatusBadgeProps extends React.ComponentProps<"span"> {
	status: string;
}

function StatusBadge({
	status,
	className,
	...props
}: Readonly<StatusBadgeProps>) {
	const presentation = getWorkflowStatusPresentation(status);

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium",
				presentation.labelClassName,
				className,
			)}
			{...props}
		>
			<span
				aria-hidden
				className={cn(
					"h-1.5 w-1.5 shrink-0 rounded-full",
					presentation.dotClassName,
				)}
			/>
			{presentation.label}
		</span>
	);
}

export { StatusBadge };
