"use client";

import { Matrix, digits, loader } from "@/components/ui-audio/matrix";
import { DemoCard, DemoSurface } from "./demo-data";

const MATRIX_PATTERNS = [
	digits[1],
	digits[2],
	digits[3],
	digits[4],
	loader[0],
	digits[5],
	digits[6],
	digits[7],
	digits[8],
];

function MatrixPreview({
	animated = true,
}: Readonly<{ animated?: boolean }>) {
	return animated ? (
		<DemoCard
			className="max-w-2xl"
			contentClassName="gap-0"
			description="LED-style matrix gallery for digits, loaders, and status patterns."
			title="Pixel Matrix"
		>
			<div className="grid grid-cols-3 gap-4 transition-all duration-1000">
				{MATRIX_PATTERNS.map((pattern, index) => (
					<div
						key={`${index}`}
						className="flex items-center justify-center transition-all duration-1000"
					>
						<Matrix
							ariaLabel={`Matrix ${index + 1}`}
							autoplay={index === 4}
							cols={5}
							fps={10}
							frames={index === 4 ? loader : undefined}
							pattern={index === 4 ? undefined : pattern}
							rows={5}
							size={10}
						/>
					</div>
				))}
			</div>
		</DemoCard>
	) : (
		<DemoSurface className="items-center">
			<Matrix
				className="text-text"
				cols={5}
				pattern={digits[4]}
				rows={5}
				size={14}
			/>
		</DemoSurface>
	);
}

export default function MatrixDemo() {
	return <MatrixPreview />;
}

export function MatrixDemoDigits() {
	return <MatrixPreview animated={false} />;
}
