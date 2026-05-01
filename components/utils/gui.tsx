"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CheckIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CopyIcon from "@atlaskit/icon/core/copy";
import UndoIcon from "@atlaskit/icon/core/undo";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { selectMountedGUIValues } from "@/components/utils/gui-values";
import { cn } from "@/lib/utils";

type GUIPanelContextValue = Readonly<{
	registerKeys: (keys: readonly string[]) => void;
	unregisterKeys: (keys: readonly string[]) => void;
}>;

const GUIPanelContext = createContext<GUIPanelContextValue | null>(null);

/** Register value keys so GUI.Panel only copies values for mounted controls. */
export function useGUIValueKeys(valueKeys?: string | readonly string[]) {
	const ctx = use(GUIPanelContext);
	const normalized = valueKeys == null ? [] : Array.isArray(valueKeys) ? valueKeys : [valueKeys];
	const serialized = normalized.join("\0");

	useEffect(() => {
		if (!ctx || normalized.length === 0) return;
		ctx.registerKeys(normalized);
		return () => ctx.unregisterKeys(normalized);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ctx, serialized]);
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function formatValue(value: number, step: number, unit?: string): string {
	const digits = step < 1 ? String(step).split(".")[1]?.length ?? 0 : 0;
	const display = digits > 0 ? value.toFixed(digits) : String(Math.round(value));
	return unit ? `${display}${unit}` : display;
}

type GUIControlProps = Readonly<{
	id: string;
	label: string;
	description?: string;
	value: number;
	defaultValue?: number;
	min: number;
	max: number;
	step: number;
	unit?: string;
	onChange: (next: number) => void;
	valueKeys?: string | readonly string[];
}>;

function GUIControl({
	id,
	label,
	description,
	value,
	defaultValue,
	min,
	max,
	step,
	unit,
	onChange,
	valueKeys,
}: GUIControlProps) {
	useGUIValueKeys(valueKeys);
	const [localInput, setLocalInput] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const displayValue = localInput ?? String(value);

	const commitRaw = (raw: string) => {
		setLocalInput(raw);
		const parsed = Number(raw);
		if (raw.length > 0 && Number.isFinite(parsed)) {
			onChange(parsed);
		}
	};

	const isDefault = defaultValue !== undefined && value === defaultValue;

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Label htmlFor={`${id}-input`} className="text-xs font-medium text-text">
					{label}
				</Label>
				<div className="ml-auto flex shrink-0 items-center gap-1">
					{defaultValue !== undefined ? (
						<button
							type="button"
							aria-label={`Reset ${label} to ${defaultValue}`}
							disabled={isDefault}
							onClick={() => {
								onChange(defaultValue);
								setLocalInput(null);
							}}
							className="flex size-7 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon disabled:pointer-events-none disabled:opacity-0"
						>
							<UndoIcon label="" size="small" />
						</button>
					) : null}
					<Input
						ref={inputRef}
						id={`${id}-input`}
						type="text"
						inputMode="decimal"
						isCompact
						value={displayValue}
						onChange={(event) => {
							commitRaw(event.currentTarget.value);
						}}
						onFocus={() => {
							setLocalInput(String(value));
						}}
						onBlur={() => {
							setLocalInput(null);
						}}
						onKeyDown={(event) => {
							if (event.key === "-") {
								event.preventDefault();
								const current = localInput ?? String(value);
								const toggled = current.startsWith("-")
									? current.slice(1)
									: `-${current}`;
								commitRaw(toggled);
								requestAnimationFrame(() => {
									inputRef.current?.setSelectionRange(
										toggled.length,
										toggled.length,
									);
								});
							}
						}}
						className="h-7 w-20 text-right font-mono text-xs tabular-nums"
					/>
					{unit ? (
						<span className="text-right text-[11px] text-text-subtle">
							{unit}
						</span>
					) : null}
				</div>
			</div>
			{description ? (
				<p className="text-[12px] leading-4 text-text-subtlest">
					{description}
				</p>
			) : null}
			<Slider
				aria-label={label}
				min={min}
				max={max}
				step={step}
				value={[clamp(value, min, max)]}
				onValueChange={(nextValue) => {
					const numericValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;
					if (typeof numericValue !== "number") return;
					onChange(clamp(numericValue, min, max));
				}}
			/>
			<div className="flex justify-between font-mono text-[11px] text-text-subtlest">
				<span>{formatValue(min, step, unit)}</span>
				<span>{formatValue(max, step, unit)}</span>
			</div>
		</div>
	);
}

type GUIPanelProps = Readonly<{
	title: string;
	values: Record<string, unknown>;
	defaultOpen?: boolean;
	onPlay?: () => void;
	children: React.ReactNode;
}>;

function GUIPanel({ title, values, defaultOpen = true, children }: GUIPanelProps) {
	const [open, setOpen] = useState(defaultOpen);
	const [copied, setCopied] = useState(false);
	const [tooltipOpen, setTooltipOpen] = useState(false);
	const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const registeredKeysRef = useRef<Map<string, number>>(new Map());
	const [mountedValueKeys, setMountedValueKeys] = useState<readonly string[]>([]);

	const syncMountedValueKeys = useCallback(() => {
		setMountedValueKeys(Array.from(registeredKeysRef.current.keys()));
	}, []);

	const registerValueKeys = useCallback((keys: readonly string[]) => {
		let changed = false;
		for (const key of keys) {
			const currentCount = registeredKeysRef.current.get(key) ?? 0;
			registeredKeysRef.current.set(key, currentCount + 1);
			if (currentCount === 0) changed = true;
		}
		if (changed) syncMountedValueKeys();
	}, [syncMountedValueKeys]);

	const unregisterValueKeys = useCallback((keys: readonly string[]) => {
		let changed = false;
		for (const key of keys) {
			const currentCount = registeredKeysRef.current.get(key) ?? 0;
			if (currentCount <= 1) {
				if (registeredKeysRef.current.delete(key)) changed = true;
			} else {
				registeredKeysRef.current.set(key, currentCount - 1);
			}
		}
		if (changed) syncMountedValueKeys();
	}, [syncMountedValueKeys]);

	const panelContext = useMemo<GUIPanelContextValue>(() => ({
		registerKeys: registerValueKeys,
		unregisterKeys: unregisterValueKeys,
	}), [registerValueKeys, unregisterValueKeys]);

	const handleCopy = useCallback(() => {
		const text = JSON.stringify(selectMountedGUIValues(values, mountedValueKeys), null, "\t");
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTooltipOpen(true);
			if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
			copiedTimerRef.current = setTimeout(() => {
				setCopied(false);
				setTooltipOpen(false);
			}, 1500);
		});
	}, [mountedValueKeys, values]);

	useEffect(() => {
		return () => {
			if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
		};
	}, []);

	return (
		<GUIPanelContext value={panelContext}>
			<TooltipProvider>
			<div className="w-full space-y-4">
				<div className="flex w-full items-center justify-between">
					<span className="text-[11px] font-semibold uppercase tracking-wider text-text-subtlest">
						{title}
					</span>
					<span className="flex items-center gap-2">
						{open ? (
							<Tooltip open={tooltipOpen} onOpenChange={(nextOpen) => {
								if (!copied) setTooltipOpen(nextOpen);
							}}>
								<TooltipTrigger
									render={
										<button
											type="button"
											aria-label="Copy values as JSON"
											onClick={handleCopy}
											className={cn(
												"flex items-center rounded p-0.5 transition-colors",
												copied
													? "text-success"
													: "text-text-subtle hover:bg-bg-neutral hover:text-text",
											)}
										>
											{copied ? (
												<CheckIcon label="" size="small" />
											) : (
												<CopyIcon label="" size="small" />
											)}
										</button>
									}
								/>
								<TooltipContent>
									{copied ? "Copied!" : "Copy values"}
								</TooltipContent>
							</Tooltip>
						) : null}
						<button
							type="button"
							aria-label={open ? "Collapse controls" : "Expand controls"}
							onClick={() => setOpen((prev) => !prev)}
							className="flex items-center"
						>
							<span
								className={cn(
									"text-icon-subtle transition-transform duration-150",
									open ? "rotate-0" : "-rotate-90",
								)}
							>
								<ChevronDownIcon label="" size="small" />
							</span>
						</button>
					</span>
				</div>
				{open ? (
					<div
						className="max-h-[min(48svh,32rem)] space-y-4 overflow-y-auto overscroll-contain py-1 pr-2 pl-1"
						data-gui-panel-scroll="true"
					>
						{children}
					</div>
				) : null}
			</div>
			</TooltipProvider>
		</GUIPanelContext>
	);
}

type GUIToggleProps = Readonly<{
	id: string;
	label: string;
	description?: string;
	checked: boolean;
	onChange: (next: boolean) => void;
	valueKeys?: string | readonly string[];
}>;

function GUIToggle({ id, label, description, checked, onChange, valueKeys }: GUIToggleProps) {
	useGUIValueKeys(valueKeys);
	const switchId = `${id}-toggle`;

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between gap-2">
				<Label htmlFor={switchId} className="text-xs font-medium text-text">
					{label}
				</Label>
				<Switch
					id={switchId}
					checked={checked}
					onCheckedChange={onChange}
					label={label}
				/>
			</div>
			{description ? (
				<p className="text-[12px] leading-4 text-text-subtlest">
					{description}
				</p>
			) : null}
		</div>
	);
}

type GUISelectOption<T extends string> = Readonly<{
	value: T;
	label: string;
}>;

const GUI_SELECT_SEGMENTED_MAX_OPTIONS = 4;

type GUISelectProps<T extends string> = Readonly<{
	id: string;
	label: string;
	description?: string;
	value: T;
	options: readonly GUISelectOption<T>[];
	onChange: (next: T) => void;
	valueKeys?: string | readonly string[];
}>;

function GUISelect<T extends string>({
	id,
	label,
	description,
	value,
	options,
	onChange,
	valueKeys,
}: GUISelectProps<T>) {
	useGUIValueKeys(valueKeys);
	const selectedOptionLabel = options.find((option) => option.value === value)?.label;
	const useDropdown = options.length > GUI_SELECT_SEGMENTED_MAX_OPTIONS;
	return (
		<div className="space-y-1.5">
			<div className="flex flex-col gap-1.5">
				<Label htmlFor={`${id}-select`} className="text-xs leading-4 font-medium text-text">
					{label}
				</Label>
				{useDropdown ? (
					<Select
						value={value}
						onValueChange={(nextValue) => onChange(nextValue as T)}
					>
						<SelectTrigger
							id={`${id}-select`}
							size="sm"
							className="w-fit min-w-40 max-w-full"
						>
							<SelectValue>{selectedOptionLabel ?? "Select option"}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				) : (
					<div className="inline-flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-md bg-bg-neutral p-0.5">
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								aria-pressed={value === option.value}
								onClick={() => {
									onChange(option.value);
								}}
								className={cn(
									"whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
									value === option.value
										? "bg-surface text-text shadow-sm"
										: "text-text-subtle hover:text-text",
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				)}
			</div>
			{description ? (
				<p className="text-[12px] leading-4 text-text-subtlest">
					{description}
				</p>
			) : null}
		</div>
	);
}

type GUITextInputProps = Readonly<{
	id: string;
	label: string;
	description?: string;
	placeholder?: string;
	value: string;
	onChange: (next: string) => void;
	valueKeys?: string | readonly string[];
}>;

function GUITextInput({ id, label, description, placeholder, value, onChange, valueKeys }: GUITextInputProps) {
	useGUIValueKeys(valueKeys);
	const inputId = `${id}-text`;

	return (
		<div className="space-y-1.5">
			<Label htmlFor={inputId} className="text-xs font-medium text-text">
				{label}
			</Label>
			<Input
				id={inputId}
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(event) => onChange(event.currentTarget.value)}
				className="h-8 text-xs"
			/>
			{description ? (
				<p className="text-[12px] leading-4 text-text-subtlest">
					{description}
				</p>
			) : null}
		</div>
	);
}

type GUISectionProps = Readonly<{
	title: string;
	defaultOpen?: boolean;
	borderTop?: boolean;
	children: React.ReactNode;
}>;

function GUISection({ title, defaultOpen = true, borderTop = true, children }: GUISectionProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div>
			{borderTop ? <div className="border-t border-border pt-4" /> : null}
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="flex w-full items-center justify-between pb-1"
			>
				<span className="text-[11px] font-semibold uppercase tracking-wider text-text-subtlest">
					{title}
				</span>
				<span
					className={cn(
						"text-icon-subtle transition-transform duration-150",
						open ? "rotate-0" : "-rotate-90",
					)}
				>
					<ChevronDownIcon label="" size="small" />
				</span>
			</button>
			{open ? (
				<div className="space-y-4 pt-1">
					{children}
				</div>
			) : null}
		</div>
	);
}

export const GUI = {
	Control: GUIControl,
	Panel: GUIPanel,
	Section: GUISection,
	Toggle: GUIToggle,
	Select: GUISelect,
	TextInput: GUITextInput,
} as const;
