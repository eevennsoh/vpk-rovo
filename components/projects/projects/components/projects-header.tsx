"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ProjectsHeaderProps {
	projectName: string;
}

export default function ProjectsHeader({ projectName }: ProjectsHeaderProps) {
	return (
		<>
			<div
				className="bg-surface"
				style={{
					padding: `${token("space.200")} ${token("space.300")}`,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexShrink: 0,
				}}
			>
				<div className="flex items-center gap-3">
					<div
						className={cn(
							"flex items-center justify-center rounded-md",
							"bg-accent-blue-subtlest",
						)}
						style={{ width: 32, height: 32 }}
					>
						<span style={{ fontSize: "16px" }}>📊</span>
					</div>
					<div>
						<h1
							className="text-text"
							style={{
								fontSize: "16px",
								fontWeight: 600,
								margin: 0,
								lineHeight: 1.3,
							}}
						>
							{projectName}
						</h1>
						<p
							className="text-text-subtlest"
							style={{
								fontSize: "12px",
								fontWeight: 400,
								margin: 0,
							}}
						>
							Project tracking & analytics
						</p>
					</div>
				</div>
			</div>
			<Separator />
		</>
	);
}
