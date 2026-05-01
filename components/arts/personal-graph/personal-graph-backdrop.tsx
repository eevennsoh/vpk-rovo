"use client";

import Ascii from "@/components/website/demos/visual/shaders/ascii";
import { cn } from "@/lib/utils";

type PersonalGraphBackdropProps = React.ComponentProps<"div">;

const PERSONAL_GRAPH_ASCII_SOURCE_COLORS = [
	"#061526",
	"#0F4F9E",
	"#58B7EB",
	"#9AD58B",
	"#EEF7E8",
] as const;

function PersonalGraphAsciiBackdrop() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-x-0 bottom-0 h-[34svh] min-h-[280px] max-h-[380px] overflow-hidden"
			data-personal-graph-editor-backdrop="ascii-shader"
			style={{
				WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.66) 18%, #000 42%, #000 84%, transparent 100%)",
				maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.66) 18%, #000 42%, #000 84%, transparent 100%)",
			}}
		>
			<div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse at 31% 72%, rgba(72, 167, 232, 0.66), transparent 43%), radial-gradient(ellipse at 66% 76%, rgba(106, 199, 131, 0.52), transparent 38%), linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(240, 249, 255, 0.52) 42%, rgba(246, 252, 241, 0.46))",
				}}
			/>
			<Ascii
				charset="binary"
				className="absolute inset-0 opacity-80"
				colorMode="monochrome"
				monoColor="#FFFFFF"
				sourceColors={PERSONAL_GRAPH_ASCII_SOURCE_COLORS}
				cellSize={12}
				opacity={0.58}
				signalBlackPoint={0.04}
				signalWhitePoint={0.9}
				signalGamma={0.82}
				presenceThreshold={0.24}
				presenceSoftness={0.26}
				directionBias={0.08}
				shimmerAmount={0.08}
				shimmerSpeed={0.38}
				speed={0.16}
				transparentBackground
			/>
		</div>
	);
}

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
			<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/90 to-transparent" />
			<div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white via-white/95 to-transparent" />
			<PersonalGraphAsciiBackdrop />
		</div>
	);
}
