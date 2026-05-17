"use client";

import type { ComponentProps, ReactNode } from "react";

import { useControllableState } from "@/hooks/use-controllable-state";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDownIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { useAudioDevices } from "@/components/ui-custom/hooks/use-audio-devices";

export { useAudioDevices } from "@/components/ui-custom/hooks/use-audio-devices";

const deviceIdRegex = /\(([\da-fA-F]{4}:[\da-fA-F]{4})\)$/;

interface MicSelectorContextType {
	data: MediaDeviceInfo[];
	value: string | undefined;
	onValueChange?: (value: string) => void;
	open: boolean;
	onOpenChange?: (open: boolean) => void;
	width: number;
	setWidth?: (width: number) => void;
}

const MicSelectorContext = createContext<MicSelectorContextType>({
	data: [],
	onOpenChange: undefined,
	onValueChange: undefined,
	open: false,
	setWidth: undefined,
	value: undefined,
	width: 200,
});

export interface MicSelectorProps extends ComponentProps<typeof Popover> {
	defaultValue?: string;
	value?: string | undefined;
	onValueChange?: (value: string | undefined) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function MicSelector({
	defaultValue,
	value: controlledValue,
	onValueChange: controlledOnValueChange,
	defaultOpen = false,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	...props
}: Readonly<MicSelectorProps>) {
	const [value, onValueChange] = useControllableState<string | undefined>({
		defaultProp: defaultValue,
		onChange: controlledOnValueChange,
		prop: controlledValue,
	});
	const [open, onOpenChange] = useControllableState({
		defaultProp: defaultOpen,
		onChange: controlledOnOpenChange,
		prop: controlledOpen,
	});
	const [width, setWidth] = useState(200);
	const { devices, loading, hasPermission, loadDevices } = useAudioDevices();

	useEffect(() => {
		if (open && !hasPermission && !loading) {
			loadDevices();
		}
	}, [open, hasPermission, loading, loadDevices]);

	const contextValue = useMemo(
		() => ({
			data: devices,
			onOpenChange,
			onValueChange,
			open,
			setWidth,
			value,
			width,
		}),
		[devices, onOpenChange, onValueChange, open, setWidth, value, width],
	);

	return (
		<MicSelectorContext value={contextValue}>
			<Popover {...props} onOpenChange={onOpenChange} open={open} />
		</MicSelectorContext>
	);
}

export type MicSelectorTriggerProps = ComponentProps<typeof Button>;

export function MicSelectorTrigger({
	children,
	...props
}: Readonly<MicSelectorTriggerProps>) {
	const { setWidth } = use(MicSelectorContext);
	const ref = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const newWidth = (entry.target as HTMLElement).offsetWidth;
				if (newWidth) {
					setWidth?.(newWidth);
				}
			}
		});

		if (ref.current) {
			resizeObserver.observe(ref.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [setWidth]);

	return (
		<PopoverTrigger
			render={<Button variant="outline" {...props} ref={ref} />}
		>
			{children}
			<ChevronsUpDownIcon
				className="shrink-0 text-muted-foreground"
				size={16}
			/>
		</PopoverTrigger>
	);
}

export interface MicSelectorContentProps
	extends ComponentProps<typeof Command> {
	popoverOptions?: ComponentProps<typeof PopoverContent>;
}

export function MicSelectorContent({
	className,
	popoverOptions,
	...props
}: Readonly<MicSelectorContentProps>) {
	const { width, onValueChange, value } = use(MicSelectorContext);

	return (
		<PopoverContent
			className={cn("p-0", className)}
			style={{ width }}
			{...popoverOptions}
		>
			<Command onValueChange={onValueChange} value={value} {...props} />
		</PopoverContent>
	);
}

export interface MicSelectorInputProps
	extends ComponentProps<typeof CommandInput> {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
}

export function MicSelectorInput(props: Readonly<MicSelectorInputProps>) {
	return <CommandInput placeholder="Search microphones..." {...props} />;
}

export interface MicSelectorListProps
	extends Omit<ComponentProps<typeof CommandList>, "children"> {
	children: (devices: MediaDeviceInfo[]) => ReactNode;
}

export function MicSelectorList({
	children,
	...props
}: Readonly<MicSelectorListProps>) {
	const { data } = use(MicSelectorContext);

	return <CommandList {...props}>{children(data)}</CommandList>;
}

export type MicSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export function MicSelectorEmpty({
	children = "No microphone found.",
	...props
}: Readonly<MicSelectorEmptyProps>) {
	return <CommandEmpty {...props}>{children}</CommandEmpty>;
}

export type MicSelectorItemProps = ComponentProps<typeof CommandItem>;

export function MicSelectorItem(props: Readonly<MicSelectorItemProps>) {
	const { onValueChange, onOpenChange } = use(MicSelectorContext);

	const handleSelect = useCallback(
		(currentValue: string) => {
			onValueChange?.(currentValue);
			onOpenChange?.(false);
		},
		[onValueChange, onOpenChange],
	);

	return <CommandItem onSelect={handleSelect} {...props} />;
}

export interface MicSelectorLabelProps extends ComponentProps<"span"> {
	device: MediaDeviceInfo;
}

export function MicSelectorLabel({
	device,
	className,
	...props
}: Readonly<MicSelectorLabelProps>) {
	const matches = device.label.match(deviceIdRegex);

	if (!matches) {
		return (
			<span className={className} {...props}>
				{device.label}
			</span>
		);
	}

	const [, deviceId] = matches;
	const name = device.label.replace(deviceIdRegex, "");

	return (
		<span className={className} {...props}>
			<span>{name}</span>
			<span className="text-muted-foreground"> ({deviceId})</span>
		</span>
	);
}

export type MicSelectorValueProps = ComponentProps<"span">;

export function MicSelectorValue({
	className,
	...props
}: Readonly<MicSelectorValueProps>) {
	const { data, value } = use(MicSelectorContext);
	const currentDevice = data.find((d) => d.deviceId === value);

	if (!currentDevice) {
		return (
			<span className={cn("flex-1 text-left", className)} {...props}>
				Select microphone...
			</span>
		);
	}

	return (
		<MicSelectorLabel
			className={cn("flex-1 text-left", className)}
			device={currentDevice}
			{...props}
		/>
	);
}
