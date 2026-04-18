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
		}),
		[alpha, blur, borderAngle, borderOpacity, dispersion, displacementScale, fillOpacity, height, lightness, mapBlur, mapInset, radius, width],
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
					<WaveGradient className="absolute inset-0 h-full w-full" />
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
			</GUI.Panel>
		</div>
	);
}
