"use client";

import { useId } from "react";
import { ROVO_SHADER_TRIAD_HEX } from "@/lib/rovo-colors";

const DEFAULT_MESH_COLORS = [...ROVO_SHADER_TRIAD_HEX] as [string, string, string];

function getShifted(array: string[], n: number): string[] {
	const shift = n % array.length;
	return [...array.slice(shift), ...array.slice(0, shift)];
}

function repeatArray(array: string[]): string[] {
	return [...array, array[0]];
}

interface MeshProps {
	className?: string;
	colorA?: string;
	colorB?: string;
	colorC?: string;
	duration?: number;
}

export default function Mesh({
	className,
	colorA = DEFAULT_MESH_COLORS[0],
	colorB = DEFAULT_MESH_COLORS[1],
	colorC = DEFAULT_MESH_COLORS[2],
	duration = 20,
}: MeshProps) {
	const id = useId();
	const dur = `${duration > 0 ? duration : 1}s`;
	const palette = [colorA, colorB, colorC];
	const idA = `gradient-${id}-a`;
	const idB = `gradient-${id}-b`;

	return (
		<div className={className} style={{ width: "100%", height: "100%" }}>
			<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
				<defs>
					<linearGradient
						id={idA}
						gradientUnits="objectBoundingBox"
						x1="0"
						y1="0"
						x2="1"
						y2="1"
					>
						<stop offset="0" stopColor="">
							<animate
								attributeName="stop-color"
								values={repeatArray(getShifted(palette, 1)).join(";")}
								dur={dur}
								repeatCount="indefinite"
							/>
						</stop>
						<stop offset=".5" stopColor="">
							<animate
								attributeName="stop-color"
								values={repeatArray(getShifted(palette, 2)).join(";")}
								dur={dur}
								repeatCount="indefinite"
							/>
						</stop>
						<stop offset="1" stopColor="">
							<animate
								attributeName="stop-color"
								values={repeatArray(getShifted(palette, 3)).join(";")}
								dur={dur}
								repeatCount="indefinite"
							/>
						</stop>
						<animateTransform
							attributeName="gradientTransform"
							type="rotate"
							from="0 .5 .5"
							to="360 .5 .5"
							dur={dur}
							repeatCount="indefinite"
						/>
					</linearGradient>
					<linearGradient
						id={idB}
						gradientUnits="objectBoundingBox"
						x1="0"
						y1="1"
						x2="1"
						y2="1"
					>
						<stop offset="0" stopColor="">
							<animate
								attributeName="stop-color"
								values={repeatArray(getShifted(palette, 1)).join(";")}
								dur={dur}
								repeatCount="indefinite"
							/>
						</stop>
						<stop offset="1" stopColor="" stopOpacity="0">
							<animate
								attributeName="stop-color"
								values={repeatArray(getShifted(palette, 2)).join(";")}
								dur={`${duration * 2}s`}
								repeatCount="indefinite"
							/>
						</stop>
						<animateTransform
							attributeName="gradientTransform"
							type="rotate"
							values="360 .5 .5;0 .5 .5"
							dur={`${duration / 2}s`}
							repeatCount="indefinite"
						/>
					</linearGradient>
					<filter id={`noiseFilter-${id}`}>
						<feTurbulence
							result="floodFill"
							type="fractalNoise"
							baseFrequency="100000"
							numOctaves={10}
							stitchTiles="stitch"
						/>
						<feBlend in="SourceGraphic" in2="floodFill" mode="normal" />
					</filter>
				</defs>
				<rect fill={`url(#${idA})`} width="100%" height="100%" />
				<rect fill={`url(#${idB})`} width="100%" height="100%" />
			</svg>
		</div>
	);
}
