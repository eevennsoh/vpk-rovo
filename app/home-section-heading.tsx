import type { ReactNode } from "react";
import { token } from "@/lib/tokens";

interface HomeSectionHeadingProps {
	id: string;
	title: string;
	count: number;
	actions?: ReactNode;
}

export function HomeSectionHeading({
	id,
	title,
	count,
	actions,
}: Readonly<HomeSectionHeadingProps>) {
	return (
		<div
			id={id}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: token("space.200"),
				paddingBlock: token("space.300"),
				paddingInline: token("space.300"),
				borderBottom: `1px solid ${token("color.border")}`,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: token("space.100"),
				}}
			>
				<span
					style={{
						fontSize: "20px",
						fontWeight: 600,
						color: token("color.text"),
					}}
				>
					{title}
				</span>
				<span
					style={{
						fontSize: "14px",
						fontWeight: 500,
						color: token("color.text.subtlest"),
					}}
				>
					{count}
				</span>
			</div>
			{actions}
		</div>
	);
}
