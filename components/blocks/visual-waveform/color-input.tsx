"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import UndoIcon from "@atlaskit/icon/core/undo";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
	hexToRgbaUnit,
	hslaToRgbaUnit,
	rgbaColorsEqual,
	rgbaUnitToCss,
	rgbaUnitToHex,
	rgbaUnitToHsla,
	rgbaUnitToRgb255,
	type RGBAColor,
} from "./color-utils";

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function createCheckerboardStyle(color: RGBAColor): CSSProperties {
	const cssColor = rgbaUnitToCss(color);

	return {
		backgroundColor: "var(--color-surface)",
		backgroundImage: `linear-gradient(${cssColor}, ${cssColor}), conic-gradient(from 45deg, rgba(9, 30, 66, 0.12) 0 25%, transparent 0 50%, rgba(9, 30, 66, 0.12) 0 75%, transparent 0 100%)`,
		backgroundSize: "100% 100%, 12px 12px",
	};
}

function cloneColor(color: RGBAColor): RGBAColor {
	return [color[0], color[1], color[2], color[3]];
}

type ColorFieldProps = Readonly<{
	id: string;
	label: string;
	max: number;
	min?: number;
	unit?: string;
	value: number;
	onChange: (next: number) => void;
}>;

function ColorField({
	id,
	label,
	max,
	min = 0,
	unit,
	value,
	onChange,
}: ColorFieldProps) {
	const [draft, setDraft] = useState<string | null>(null);
	const displayValue = draft ?? String(value);
	const hasUnit = Boolean(unit);

	return (
		<div className="space-y-1">
			<Label htmlFor={id} className="text-[11px] font-medium text-text-subtle">
				{label}
			</Label>
			<div className="relative">
				<Input
					id={id}
					type="text"
					inputMode="decimal"
					value={displayValue}
					onChange={(event) => {
						const rawValue = event.currentTarget.value;
						setDraft(rawValue);
						const parsed = Number(rawValue);
						if (!Number.isFinite(parsed)) {
							return;
						}

						onChange(clamp(parsed, min, max));
					}}
					onBlur={() => {
						setDraft(null);
					}}
					isMonospaced
					className={hasUnit ? "h-8 pr-7 pl-2 text-right text-xs" : "h-8 px-2 text-right text-xs"}
				/>
				{unit ? (
					<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-subtlest">
						{unit}
					</span>
				) : null}
			</div>
		</div>
	);
}

type ColorInputProps = Readonly<{
	id: string;
	label: string;
	value: RGBAColor;
	defaultValue?: RGBAColor;
	onChange: (next: RGBAColor) => void;
}>;

export function ColorInput({
	id,
	label,
	value,
	defaultValue,
	onChange,
}: ColorInputProps) {
	const [format, setFormat] = useState<"hex" | "rgb" | "hsl">("hex");
	const [open, setOpen] = useState(false);
	const [hexDraft, setHexDraft] = useState(rgbaUnitToHex(value));

	const rgb = useMemo(() => rgbaUnitToRgb255(value), [value]);
	const hsl = useMemo(() => rgbaUnitToHsla(value), [value]);
	const alphaPercent = Math.round(value[3] * 100);
	const swatchStyle = useMemo(() => createCheckerboardStyle(value), [value]);
	const isDefault = defaultValue ? rgbaColorsEqual(value, defaultValue) : true;

	useEffect(() => {
		setHexDraft(rgbaUnitToHex(value));
	}, [value]);

	const updateRgb = (index: 0 | 1 | 2, nextValue: number) => {
		const nextColor = cloneColor(value);
		nextColor[index] = clamp(nextValue, 0, 255) / 255;
		onChange(nextColor);
	};

	const updateAlphaPercent = (nextValue: number) => {
		const nextColor = cloneColor(value);
		nextColor[3] = clamp(nextValue, 0, 100) / 100;
		onChange(nextColor);
	};

	const updateHsl = (index: 0 | 1 | 2, nextValue: number) => {
		const nextHsl = [...hsl] as typeof hsl;
		nextHsl[index] = nextValue;
		onChange(hslaToRgbaUnit(nextHsl[0], nextHsl[1], nextHsl[2], value[3]));
	};

	return (
		<div className="flex items-center justify-between gap-3">
			<Label htmlFor={`${id}-trigger`} className="text-xs font-medium text-text">
				{label}
			</Label>
			<div className="flex items-center gap-1.5">
				{defaultValue ? (
					<button
						type="button"
						aria-label={`Reset ${label}`}
						disabled={isDefault}
						onClick={() => onChange(cloneColor(defaultValue))}
						className="flex size-6 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon disabled:pointer-events-none disabled:opacity-0"
					>
						<UndoIcon label="" size="small" />
					</button>
				) : null}
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger
						render={
							<button
								id={`${id}-trigger`}
								type="button"
								aria-label={`Edit ${label}`}
								className="relative size-7 overflow-hidden rounded-md border border-border bg-surface transition-transform hover:scale-[1.02] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 outline-none"
							/>
						}
					>
						<span className="absolute inset-0" style={swatchStyle} />
					</PopoverTrigger>
					<PopoverContent align="end" className="w-[320px] gap-3 p-3">
						<div className="flex items-start gap-3">
							<div className="relative size-12 overflow-hidden rounded-md border border-border bg-surface">
								<div className="absolute inset-0" style={swatchStyle} />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs font-medium text-text">{label}</p>
								<p className="font-mono text-[11px] text-text-subtle">
									{rgbaUnitToHex(value)}
								</p>
								<p className="text-[11px] text-text-subtlest">
									Alpha {alphaPercent}%
								</p>
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between gap-2">
								<Label htmlFor={`${id}-alpha`} className="text-xs font-medium text-text">
									Alpha
								</Label>
								<span className="font-mono text-[11px] text-text-subtle">
									{alphaPercent}%
								</span>
							</div>
							<Slider
								aria-label={`${label} alpha`}
								max={100}
								min={0}
								step={1}
								value={[alphaPercent]}
								onValueChange={(nextValue) => {
									const numericValue = Array.isArray(nextValue)
										? nextValue[0]
										: nextValue;
									if (typeof numericValue !== "number") {
										return;
									}

									updateAlphaPercent(numericValue);
								}}
							/>
						</div>

						<Tabs
							value={format}
							onValueChange={(nextValue) => {
								setFormat(nextValue as typeof format);
							}}
							className="gap-3"
						>
							<TabsList className="w-full">
								<TabsTrigger value="hex">HEX</TabsTrigger>
								<TabsTrigger value="rgb">RGB</TabsTrigger>
								<TabsTrigger value="hsl">HSL</TabsTrigger>
							</TabsList>

							<TabsContent value="hex" className="space-y-1.5">
								<Label htmlFor={`${id}-hex`} className="text-xs font-medium text-text">
									Hex With Alpha
								</Label>
								<Input
									id={`${id}-hex`}
									type="text"
									autoCapitalize="characters"
									autoCorrect="off"
									spellCheck={false}
									value={hexDraft}
									onChange={(event) => {
										const nextDraft = event.currentTarget.value.toUpperCase();
										setHexDraft(nextDraft);

										const parsed = hexToRgbaUnit(nextDraft, value[3]);
										if (parsed) {
											onChange(parsed);
										}
									}}
									onBlur={() => {
										setHexDraft(rgbaUnitToHex(value));
									}}
									className="h-8 font-mono text-xs"
								/>
								<p className="text-[11px] leading-4 text-text-subtlest">
									Accepts `#RGB`, `#RGBA`, `#RRGGBB`, and `#RRGGBBAA`.
								</p>
							</TabsContent>

							<TabsContent value="rgb" className="grid grid-cols-4 gap-2">
								<ColorField
									id={`${id}-rgb-r`}
									label="R"
									max={255}
									value={rgb[0]}
									onChange={(nextValue) => updateRgb(0, nextValue)}
								/>
								<ColorField
									id={`${id}-rgb-g`}
									label="G"
									max={255}
									value={rgb[1]}
									onChange={(nextValue) => updateRgb(1, nextValue)}
								/>
								<ColorField
									id={`${id}-rgb-b`}
									label="B"
									max={255}
									value={rgb[2]}
									onChange={(nextValue) => updateRgb(2, nextValue)}
								/>
								<ColorField
									id={`${id}-rgb-a`}
									label="A"
									max={100}
									unit="%"
									value={alphaPercent}
									onChange={updateAlphaPercent}
								/>
							</TabsContent>

							<TabsContent value="hsl" className="grid grid-cols-4 gap-2">
								<ColorField
									id={`${id}-hsl-h`}
									label="H"
									max={360}
									value={Math.round(hsl[0])}
									onChange={(nextValue) => updateHsl(0, nextValue)}
								/>
								<ColorField
									id={`${id}-hsl-s`}
									label="S"
									max={100}
									unit="%"
									value={Math.round(hsl[1])}
									onChange={(nextValue) => updateHsl(1, nextValue)}
								/>
								<ColorField
									id={`${id}-hsl-l`}
									label="L"
									max={100}
									unit="%"
									value={Math.round(hsl[2])}
									onChange={(nextValue) => updateHsl(2, nextValue)}
								/>
								<ColorField
									id={`${id}-hsl-a`}
									label="A"
									max={100}
									unit="%"
									value={alphaPercent}
									onChange={updateAlphaPercent}
								/>
							</TabsContent>
						</Tabs>
					</PopoverContent>
				</Popover>
				<span className="w-24 font-mono text-[11px] text-text-subtle">
					{rgbaUnitToHex(value)}
				</span>
			</div>
		</div>
	);
}
