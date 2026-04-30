"use client";

import { cn } from "@/lib/utils";

type PersonalGraphBackdropProps = React.ComponentProps<"div">;

export function PersonalGraphBackdrop({
	className,
	...props
}: Readonly<PersonalGraphBackdropProps>) {
	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-white", className)}
			data-personal-graph-editor-backdrop="light-grid"
			{...props}
		>
			<div
				className="absolute inset-0 opacity-80"
				style={{
					backgroundImage:
						"linear-gradient(to right, rgba(9, 30, 66, 0.075) 1px, transparent 1px), linear-gradient(to bottom, rgba(9, 30, 66, 0.075) 1px, transparent 1px)",
					backgroundSize: "72px 72px",
				}}
			/>
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(circle at 50% 75%, rgba(24, 104, 219, 0.1), transparent 32%), radial-gradient(circle at 24% 26%, rgba(252, 167, 0, 0.12), transparent 28%)",
				}}
			/>
			<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/90 to-transparent" />
			<div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white via-white/95 to-transparent" />
		</div>
	);
}
