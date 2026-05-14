"use client";

import { token } from "@/lib/tokens";

interface LabelTagProps {
	children: string;
}

export function LabelTag({ children }: Readonly<LabelTagProps>) {
	return (
		<span
			style={{
				padding: "2px 4px",
				fontSize: "14px",
				border: `1px solid ${token("color.border")}`,
				borderRadius: token("radius.medium"),
				backgroundColor: "transparent",
			}}
		>
			{children}
		</span>
	);
}
