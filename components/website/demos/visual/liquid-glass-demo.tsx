"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import LiquidGlass from "./shaders/liquid-glass";
import WaveGradient from "./shaders/wave-gradient";

const DEFAULT_STAGE_WIDTH = 200;
const DEFAULT_STAGE_HEIGHT = 100;
const DEFAULT_RADIUS = 81;
const DEFAULT_FILL_OPACITY = 0.1;
const DEFAULT_DISPLACEMENT_SCALE = -133;
const DEFAULT_BLUR = 4.15;
const DEFAULT_BORDER_OPACITY = 0.7;
const DEFAULT_BORDER_ANGLE = 315;
const DEFAULT_LIGHTNESS = 88;
const DEFAULT_ALPHA = 0.9;
const DEFAULT_DISPERSION = 0;
const DEFAULT_MAP_BLUR = 5;
const DEFAULT_MAP_INSET = 0.05;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function useElementSize<T extends HTMLElement>(fallback: { width: number; height: number }) {
	const ref = useRef<T>(null);
	const [size, setSize] = useState(fallback);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const update = () => {
			const nextWidth = element.clientWidth;
			const nextHeight = element.clientHeight;
			if (nextWidth > 0 && nextHeight > 0) {
				setSize((current) => {
					if (current.width === nextWidth && current.height === nextHeight) {
						return current;
					}

					return { width: nextWidth, height: nextHeight };
				});
			}
		};

		update();

		if (typeof ResizeObserver === "undefined") {
			return undefined;
		}

		const observer = new ResizeObserver(() => {
			update();
		});
		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, []);

	return { ref, size };
}

function StageBackground({ preset }: Readonly<{ preset: BackgroundPreset }>) {
	const imageLayer = (
		<>
			<Image
				src={BACKGROUND_IMAGE_SRC}
				alt=""
				aria-hidden="true"
				width={1200}
				height={1200}
				sizes="(max-width: 768px) 100vw, 720px"
				className="absolute inset-0 h-full w-full object-cover object-center"
			/>
			<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08)_40%,rgba(255,255,255,0.2))]" />
		</>
	);

	if (preset === "aurora") {
		return (
			<>
				<div className="absolute inset-0 bg-[#f7f5ef]" />
				{imageLayer}
				<div className="absolute left-[8%] top-[10%] h-48 w-48 rounded-full bg-[#ffc9a9]/55 blur-3xl" />
				<div className="absolute right-[10%] top-[18%] h-56 w-56 rounded-full bg-[#8ed0ff]/45 blur-3xl" />
				<div className="absolute bottom-[8%] left-[20%] h-64 w-64 rounded-full bg-[#ffe58f]/35 blur-3xl" />
				<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_38%,rgba(255,255,255,0.82))]" />
			</>
		);
	}

	if (preset === "schematic") {
		return (
			<>
				<div className="absolute inset-0 bg-[#f6f5f2]" />
				{imageLayer}
				<div
					className="absolute inset-0 opacity-50"
					style={{
						backgroundImage: [
							"linear-gradient(rgba(17,24,39,0.035) 1px, transparent 1px)",
							"linear-gradient(90deg, rgba(17,24,39,0.035) 1px, transparent 1px)",
						].join(", "),
						backgroundSize: "48px 48px",
					}}
				/>
				<div className="absolute inset-y-[12%] left-[17%] w-px bg-black/10" />
				<div className="absolute inset-y-[18%] right-[18%] w-px bg-black/8" />
				<div className="absolute left-[12%] right-[12%] top-[16%] h-px bg-black/10" />
				<div className="absolute left-[16%] top-[22%] h-28 w-28 rounded-full border border-black/10" />
				<div className="absolute bottom-[14%] right-[15%] h-36 w-36 rounded-full border border-black/8" />
			</>
		);
	}

	return (
		<>
			<div className="absolute inset-0 bg-[#fbfbfa]" />
			{imageLayer}
			<div className="absolute left-1/2 top-[6%] h-24 w-[72%] -translate-x-1/2 rounded-full bg-white/75 blur-3xl" />
			<div className="absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.06))]" />
		</>
	);
}

export default function LiquidGlassDemo() {
	const [width, setWidth] = useState(DEFAULT_STAGE_WIDTH);
	const [height, setHeight] = useState(DEFAULT_STAGE_HEIGHT);
	const [radius, setRadius] = useState(DEFAULT_RADIUS);
	const [fillOpacity, setFillOpacity] = useState(DEFAULT_FILL_OPACITY);
	const [displacementScale, setDisplacementScale] = useState(DEFAULT_DISPLACEMENT_SCALE);
	const [blur, setBlur] = useState(DEFAULT_BLUR);
	const [borderOpacity, setBorderOpacity] = useState(DEFAULT_BORDER_OPACITY);
	const [borderAngle, setBorderAngle] = useState(DEFAULT_BORDER_ANGLE);
	const [lightness, setLightness] = useState(DEFAULT_LIGHTNESS);
	const [alpha, setAlpha] = useState(DEFAULT_ALPHA);
	const [dispersion, setDispersion] = useState(DEFAULT_DISPERSION);
	const [mapBlur, setMapBlur] = useState(DEFAULT_MAP_BLUR);
	const [mapInset, setMapInset] = useState(DEFAULT_MAP_INSET);
	const [backgroundPreset, setBackgroundPreset] = useState<BackgroundPreset>("framer");
	const { ref: stageViewportRef, size: stageViewportSize } = useElementSize<HTMLDivElement>({
		width: 520,
		height: 520,
	});

	const fittedScale = useMemo(() => {
		if (stageViewportSize.width <= 0 || stageViewportSize.height <= 0) {
			return 1;
		}

		return clamp(
			Math.min(stageViewportSize.width / width, stageViewportSize.height / height),
			0,
			1,
		);
	}, [height, stageViewportSize.height, stageViewportSize.width, width]);

	const fittedWidth = width * fittedScale;
	const fittedHeight = height * fittedScale;

	const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		dragRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			originX: position.x,
			originY: position.y,
		};
	}, [position]);

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!dragRef.current) return;
		setPosition({
			x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
			y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
		});
	}, []);

	const onPointerUp = useCallback(() => {
		dragRef.current = null;
	}, []);
	const config = useMemo(
		() => ({
			width,
			height,
			radius,
			fillOpacity,
			displacementScale,
			blur,
			borderOpacity,
			borderAngle,
			lightness,
			alpha,
			dispersion,
			mapBlur,
			mapInset,
			backgroundPreset,
		}),
		[alpha, backgroundPreset, blur, borderAngle, borderOpacity, dispersion, displacementScale, fillOpacity, height, lightness, mapBlur, mapInset, radius, width],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="relative overflow-hidden border border-border"
				style={{
					borderRadius: 28,
					boxShadow: token("elevation.shadow.raised"),
					backgroundColor: token("elevation.surface"),
				}}
			>
				<div
					ref={stageViewportRef}
					className="relative flex w-full items-center justify-center overflow-hidden px-6 py-8"
					style={{
						minHeight: 420,
						height: "min(72vh, 560px)",
					}}
				>
					<StageBackground preset={backgroundPreset} />
					<div
						className="relative z-10 cursor-grab select-none active:cursor-grabbing"
						style={{
							width: fittedWidth,
							height: fittedHeight,
							transform: `translate(${position.x}px, ${position.y}px)`,
							willChange: "transform",
							touchAction: "none",
						}}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onPointerCancel={onPointerUp}
					>
						<div
							style={{
								width,
								height,
								transform: `scale(${fittedScale})`,
								transformOrigin: "top left",
							}}
						>
							<LiquidGlass
								className="size-full"
								radius={radius}
								fillOpacity={fillOpacity}
								displacementScale={displacementScale}
								blur={blur}
								borderOpacity={borderOpacity}
								borderAngle={borderAngle}
								lightness={lightness}
								alpha={alpha}
								dispersion={dispersion}
								mapBlur={mapBlur}
								mapInset={mapInset}
							/>
						</div>
					</div>
				</div>
			</div>

			<GUI.Panel title="Glass controls" values={config}>
				<GUI.Control
					id="liquid-glass-width"
					label="Width"
					value={width}
					defaultValue={DEFAULT_STAGE_WIDTH}
					min={120}
					max={320}
					step={1}
					unit="px"
					onChange={setWidth}
				/>
				<GUI.Control
					id="liquid-glass-height"
					label="Height"
					value={height}
					defaultValue={DEFAULT_STAGE_HEIGHT}
					min={260}
					max={760}
					step={1}
					unit="px"
					onChange={setHeight}
				/>
				<GUI.Control
					id="liquid-glass-radius"
					label="Radius"
					value={radius}
					defaultValue={DEFAULT_RADIUS}
					min={12}
					max={160}
					step={1}
					unit="px"
					onChange={setRadius}
				/>
				<GUI.Control
					id="liquid-glass-displacement"
					label="Scale"
					value={displacementScale}
					defaultValue={DEFAULT_DISPLACEMENT_SCALE}
					min={-360}
					max={360}
					step={1}
					onChange={setDisplacementScale}
				/>
				<GUI.Control
					id="liquid-glass-dispersion"
					label="Dispersion"
					value={dispersion}
					defaultValue={DEFAULT_DISPERSION}
					min={0}
					max={100}
					step={1}
					onChange={setDispersion}
				/>
				<GUI.Control
					id="liquid-glass-lightness"
					label="Lightness"
					value={lightness}
					defaultValue={DEFAULT_LIGHTNESS}
					min={0}
					max={100}
					step={1}
					onChange={setLightness}
				/>
				<GUI.Control
					id="liquid-glass-blur"
					label="Blur"
					value={blur}
					defaultValue={DEFAULT_BLUR}
					min={0}
					max={10}
					step={0.01}
					onChange={setBlur}
				/>
				<GUI.Control
					id="liquid-glass-alpha"
					label="Alpha"
					value={alpha}
					defaultValue={DEFAULT_ALPHA}
					min={0}
					max={1}
					step={0.01}
					onChange={setAlpha}
				/>
				<GUI.Control
					id="liquid-glass-map-blur"
					label="Map blur"
					value={mapBlur}
					defaultValue={DEFAULT_MAP_BLUR}
					min={0}
					max={100}
					step={1}
					unit="px"
					onChange={setMapBlur}
				/>
				<GUI.Control
					id="liquid-glass-map-inset"
					label="Map inset"
					value={mapInset}
					defaultValue={DEFAULT_MAP_INSET}
					min={0}
					max={0.5}
					step={0.01}
					onChange={setMapInset}
				/>
				<GUI.Control
					id="liquid-glass-fill-opacity"
					label="Frost"
					value={fillOpacity}
					defaultValue={DEFAULT_FILL_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setFillOpacity}
				/>
				<GUI.Control
					id="liquid-glass-border-opacity"
					label="Border opacity"
					value={borderOpacity}
					defaultValue={DEFAULT_BORDER_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setBorderOpacity}
				/>
				<GUI.Control
					id="liquid-glass-border-angle"
					label="Border angle"
					value={borderAngle}
					defaultValue={DEFAULT_BORDER_ANGLE}
					min={0}
					max={360}
					step={1}
					unit="deg"
					onChange={setBorderAngle}
				/>
				<GUI.Select
					id="liquid-glass-background"
					label="Background preset"
					value={backgroundPreset}
					options={BACKGROUND_OPTIONS}
					onChange={setBackgroundPreset}
				/>
			</GUI.Panel>
		</div>
	);
}
