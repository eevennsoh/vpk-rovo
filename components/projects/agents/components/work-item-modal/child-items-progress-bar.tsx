"use client";

import { token } from "@/lib/tokens";

export function ChildItemsProgressBar() {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: token("space.200"),
				marginBottom: token("space.100"),
			}}
		>
			<div
				style={{
					flex: 1,
					display: "flex",
					height: "6px",
					borderRadius: token("radius.small"),
					overflow: "hidden",
				}}
			>
				<div
					style={{
						flex: 1,
						backgroundColor: token("color.background.success.bold"),
						borderRadius: `${token("radius.small")} 0 0 ${token("radius.small")}`,
					}}
					title="1 of 3 Done"
				/>
				<div
					style={{ flex: 1, backgroundColor: token("color.background.information.bold") }}
					title="1 of 3 In progress"
				/>
				<div
					style={{
						flex: 1,
						backgroundColor: token("color.border"),
						borderRadius: `0 ${token("radius.small")} ${token("radius.small")} 0`,
					}}
					title="1 of 3 To do"
				/>
			</div>
			<span className="text-sm">33% Done</span>
		</div>
	);
}
