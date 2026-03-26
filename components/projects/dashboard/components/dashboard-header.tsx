"use client";

import { token } from "@/lib/tokens";
import { Separator } from "@/components/ui/separator";

export default function DashboardHeader() {
	return (
		<div>
			<div
				style={{
					padding: `${token("space.200")} ${token("space.300")}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<div>
					<h1
						className="text-text"
						style={{
							fontSize: "20px",
							fontWeight: 600,
							margin: 0,
							lineHeight: 1.4,
						}}
					>
						Work Dashboard
					</h1>
					<p
						className="text-text-subtlest"
						style={{
							fontSize: "14px",
							margin: 0,
							marginTop: token("space.050"),
						}}
					>
						Track and manage your team&apos;s work across all projects
					</p>
				</div>
			</div>
			<Separator />
		</div>
	);
}
