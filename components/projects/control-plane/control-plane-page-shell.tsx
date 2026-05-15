"use client";

import type { ReactNode } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

import { ControlPlaneSurfaceNav } from "./control-plane-surface-nav";

interface ControlPlanePageShellProps {
	actions?: ReactNode;
	children: ReactNode;
	className?: string;
	description: string;
	showHeader?: boolean;
	title: string;
}

export function ControlPlanePageShell({
	actions,
	children,
	className,
	description,
	showHeader = true,
	title,
}: Readonly<ControlPlanePageShellProps>) {
	return (
		<div className={cn("relative min-h-full overflow-hidden bg-background", className)}>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-64"
				style={{
					background:
						"radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 55%), radial-gradient(circle at left top, rgba(20, 184, 166, 0.08), transparent 40%)",
				}}
			/>
			<div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
				{showHeader ? (
					<div className="space-y-4">
						<PageHeader description={description} title={title} actions={actions} />
						<ControlPlaneSurfaceNav />
					</div>
				) : actions ? (
					<div className="flex justify-end">{actions}</div>
				) : null}
				{children}
			</div>
		</div>
	);
}
