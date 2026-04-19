"use client";

import AddIcon from "@atlaskit/icon/core/add";
import CrossIcon from "@atlaskit/icon/core/cross";
import UndoIcon from "@atlaskit/icon/core/undo";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function normalizeColorValue(value: string): string {
	return value.trim().toLowerCase();
}

function isHexColor(value: string): boolean {
	return /^#[0-9a-f]{6}$/i.test(value.trim());
}

function resolvePickerValue(value: string, fallback?: string): string {
	if (isHexColor(value)) {
		return value;
	}

	if (fallback && isHexColor(fallback)) {
		return fallback;
	}

	return "#000000";
}

function areColorListsEqual(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length
		&& a.every((value, index) => normalizeColorValue(value) === normalizeColorValue(b[index] ?? ""));
}

type ResetButtonProps = Readonly<{
	ariaLabel: string;
	disabled: boolean;
	onClick: () => void;
}>;

function ResetButton({ ariaLabel, disabled, onClick }: ResetButtonProps) {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			disabled={disabled}
			onClick={onClick}
			className="flex size-7 shrink-0 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon disabled:pointer-events-none disabled:opacity-0"
		>
			<UndoIcon label="" size="small" />
		</button>
	);
}

type ShaderColorInputProps = Readonly<{
	id: string;
	label: string;
	value: string;
	defaultValue?: string;
	disabled?: boolean;
	onChange: (next: string) => void;
}>;

export function ShaderColorInput({
	id,
	label,
	value,
	defaultValue,
	disabled,
	onChange,
}: ShaderColorInputProps) {
	const isDefault = defaultValue == null
		? true
		: normalizeColorValue(value) === normalizeColorValue(defaultValue);

	return (
		<div className={cn("space-y-2", disabled && "pointer-events-none opacity-40")}>
			<div className="flex items-center gap-2">
				<Label htmlFor={`${id}-text`} className="text-xs font-medium text-text">
					{label}
				</Label>
				{defaultValue ? (
					<div className="ml-auto">
						<ResetButton
							ariaLabel={`Reset ${label}`}
							disabled={isDefault || !!disabled}
							onClick={() => onChange(defaultValue)}
						/>
					</div>
				) : null}
			</div>
			<div className="flex items-center gap-2">
				<input
					id={`${id}-picker`}
					type="color"
					aria-label={`${label} color`}
					value={resolvePickerValue(value, defaultValue)}
					onChange={(event) => onChange(event.currentTarget.value)}
					disabled={disabled}
					className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
				/>
				<Input
					id={`${id}-text`}
					type="text"
					value={value}
					onChange={(event) => onChange(event.currentTarget.value)}
					disabled={disabled}
					isCompact
					isMonospaced
					className="h-7 flex-1 text-xs"
				/>
			</div>
		</div>
	);
}

type ShaderColorListControlProps = Readonly<{
	id: string;
	label: string;
	value: readonly string[];
	defaultValue?: readonly string[];
	onChange: (next: string[]) => void;
	allowAddRemove?: boolean;
	addColor?: string;
	maxColors?: number;
}>;

export function ShaderColorListControl({
	id,
	label,
	value,
	defaultValue,
	onChange,
	allowAddRemove = false,
	addColor = "#808080",
	maxColors,
}: ShaderColorListControlProps) {
	const isDefault = defaultValue == null ? true : areColorListsEqual(value, defaultValue);
	const canAdd = allowAddRemove && (maxColors == null || value.length < maxColors);
	const canRemove = allowAddRemove && value.length > 1;

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Label className="text-xs font-medium text-text">{label}</Label>
				{defaultValue ? (
					<div className="ml-auto">
						<ResetButton
							ariaLabel={`Reset ${label}`}
							disabled={isDefault}
							onClick={() => onChange([...defaultValue])}
						/>
					</div>
				) : null}
			</div>
			<div className="flex flex-col gap-1.5">
				{value.map((color, index) => (
					<div key={`${id}-${index}`} className="flex items-center gap-2">
						<input
							type="color"
							aria-label={`${label} color ${index + 1}`}
							value={resolvePickerValue(color, defaultValue?.[index])}
							onChange={(event) => {
								const next = [...value];
								next[index] = event.currentTarget.value;
								onChange(next);
							}}
							className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
						/>
						<Input
							type="text"
							aria-label={`${label} value ${index + 1}`}
							value={color}
							onChange={(event) => {
								const next = [...value];
								next[index] = event.currentTarget.value;
								onChange(next);
							}}
							isCompact
							isMonospaced
							className="h-7 flex-1 text-xs"
						/>
						{canRemove ? (
							<button
								type="button"
								aria-label={`Remove ${label} ${index + 1}`}
								onClick={() => onChange(value.filter((_, valueIndex) => valueIndex !== index))}
								className="flex size-7 shrink-0 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon"
							>
								<CrossIcon label="" size="small" />
							</button>
						) : null}
					</div>
				))}
				{canAdd ? (
					<button
						type="button"
						onClick={() => onChange([...value, addColor])}
						className="flex h-7 items-center gap-1.5 rounded px-1 text-xs text-text-subtle transition-colors hover:bg-bg-neutral hover:text-text"
					>
						<AddIcon label="" size="small" />
						<span>Add color</span>
					</button>
				) : null}
			</div>
		</div>
	);
}
