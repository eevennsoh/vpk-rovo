import * as React from "react"

import CheckCircleIcon from "@atlaskit/icon/core/check-circle"
import NodeIcon from "@atlaskit/icon/core/node"
import WarningIcon from "@atlaskit/icon/core/warning"

import { token } from "@/lib/tokens"
import { cn } from "@/lib/utils"

export type ProgressTrackerStepState = "todo" | "current" | "done" | "warning"

export interface ProgressTrackerStep {
	id: string
	label: React.ReactNode
	byline?: React.ReactNode
	state?: ProgressTrackerStepState
}

export interface ProgressTrackerProps extends React.ComponentProps<"ol"> {
	steps: ReadonlyArray<ProgressTrackerStep>
	labelClassName?: string
	bylineClassName?: string
}

function StepIcon({ state }: Readonly<{ state: ProgressTrackerStepState }>) {
	if (state === "done") {
		return <CheckCircleIcon label="" size="small" color={token("color.icon.success")} />
	}

	if (state === "warning") {
		return <WarningIcon label="" size="small" color={token("color.icon.warning")} />
	}

	if (state === "current") {
		return (
			<div className="flex size-3 items-center justify-center">
				<div className="size-3 animate-spin rounded-full border border-border border-t-text-subtle" />
			</div>
		)
	}

	return <NodeIcon label="" size="small" color={token("color.icon.subtlest")} />
}

function ProgressTracker({
	steps,
	className,
	labelClassName,
	bylineClassName,
	...props
}: Readonly<ProgressTrackerProps>) {
	const stepKeys = React.useMemo(() => {
		const keyTotals = new Map<string, number>()
		const baseKeys = steps.map((step, index) => {
			const normalizedId = step.id.trim()
			const normalizedLabel = typeof step.label === "string" ? step.label.trim() : ""
			const baseKey = normalizedId || normalizedLabel || `step-${index + 1}`
			keyTotals.set(baseKey, (keyTotals.get(baseKey) ?? 0) + 1)
			return baseKey
		})

		const seenCounts = new Map<string, number>()
		return baseKeys.map((baseKey) => {
			const seenCount = (seenCounts.get(baseKey) ?? 0) + 1
			seenCounts.set(baseKey, seenCount)
			return (keyTotals.get(baseKey) ?? 0) > 1 ? `${baseKey}-${seenCount}` : baseKey
		})
	}, [steps])

	return (
		<ol data-slot="progress-tracker" aria-label="Progress" className={cn("flex flex-col", className)} {...props}>
			{steps.map((step, index) => {
				const state = step.state ?? "todo"
				const isLast = index === steps.length - 1

				return (
					<li key={stepKeys[index]} className="flex gap-1">
						<div className="flex w-5 shrink-0 flex-col items-center">
							<div className="flex h-6 shrink-0 items-center justify-center">
								<StepIcon state={state} />
							</div>
							{!isLast ? <div className="min-h-4 w-px flex-1 bg-border" /> : null}
						</div>
						<div
							data-slot="progress-tracker-content"
							className={cn(
								"min-w-0 flex-1 px-1",
								step.byline ? "grid gap-1 pt-0.5" : "flex h-6 items-center",
								step.byline && !isLast && "pb-5"
							)}
						>
							<span
								data-slot="progress-tracker-label"
								className={cn(
									"text-xs leading-4",
									state === "done" && "text-text",
									state === "warning" && "text-text",
									state === "current" && "text-text font-medium",
									state === "todo" && "text-text-subtlest",
									labelClassName
								)}
							>
								{step.label}
							</span>
							{step.byline ? (
								<span
									data-slot="progress-tracker-byline"
									className={cn("text-xs leading-4 text-text-subtlest", bylineClassName)}
								>
									{step.byline}
								</span>
							) : null}
						</div>
					</li>
				)
			})}
		</ol>
	)
}

export { ProgressTracker }
