import type { ReactNode } from "react";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const DEMO_SHELL_MIN_HEIGHT_PX = 400;
const DEMO_SHELL_PADDING_PX = 24;
const DEMO_CONTENT_MIN_HEIGHT_PX = DEMO_SHELL_MIN_HEIGHT_PX - DEMO_SHELL_PADDING_PX * 2;
const FULL_PAGE_HEIGHT_PX = 1000;
interface DemoPreviewShellProps {
	children: ReactNode;
	/** When true, constrains the shell to a fixed height for full-page demos (templates, sidebars). */
	fullPage?: boolean;
	/** When true (with fullPage), the shell auto-sizes to content instead of using a fixed height. */
	fitContent?: boolean;
}

export function DemoPreviewShell({ children, fullPage, fitContent }: Readonly<DemoPreviewShellProps>) {
	if (fullPage) {
		return (
			<div
				className={cn(
					"relative w-full",
					!fitContent && "overflow-hidden [&>*]:h-full",
					"[&_[data-slot=sidebar-wrapper]]:!min-h-full [&_[data-slot=sidebar-wrapper]]:!h-full",
					"[&_[data-slot=sidebar-container]]:!h-full",
					"[&_[data-slot=sidebar-inset]]:!min-h-0 [&_[data-slot=sidebar-inset]]:!h-full",
				)}
				style={{
					...(!fitContent && { height: FULL_PAGE_HEIGHT_PX }),
					border: `1px solid ${token("color.border")}`,
					borderRadius: token("radius.large"),
					transform: "translateZ(0)",
				}}
			>
				{children}
			</div>
		);
	}

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				maxWidth: "100%",
				border: `1px solid ${token("color.border")}`,
				borderRadius: token("radius.large"),
				overflow: "auto",
			}}
		>
			<div
				style={{
					display: "flex",
					width: "100%",
					minHeight: DEMO_SHELL_MIN_HEIGHT_PX,
					padding: DEMO_SHELL_PADDING_PX,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						display: "flex",
						flex: 1,
						width: "100%",
						minWidth: "100%",
						maxWidth: "100%",
						minHeight: DEMO_CONTENT_MIN_HEIGHT_PX,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
