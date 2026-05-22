"use client"

import CheckMarkIcon from "@atlaskit/icon/core/check-mark"
import CrossIcon from "@atlaskit/icon/core/cross"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

type SwitchSize = "sm" | "default" | "lg"

export interface SwitchProps extends Omit<SwitchPrimitive.Root.Props, "checked" | "onCheckedChange" | "disabled"> {
	size?: SwitchSize
	checked?: boolean
	onCheckedChange?: (checked: boolean) => void
	disabled?: boolean
	label?: string
}

function Switch({
	className,
	size = "default",
	checked,
	onCheckedChange,
	disabled,
	label,
	"aria-label": ariaLabel,
	...props
}: Readonly<SwitchProps>) {
	const controlledProps =
		checked !== undefined
			? { checked, onCheckedChange }
			: onCheckedChange
				? { onCheckedChange }
				: {};

	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			className={cn(
				"shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-transparent bg-clip-content p-0.5 box-content peer group/switch relative inline-flex items-center outline-none after:absolute after:-inset-x-3 after:-inset-y-2 transition-colors duration-medium ease-out data-[size=default]:h-4 data-[size=default]:w-8 data-[size=sm]:h-3 data-[size=sm]:w-6 data-[size=lg]:h-5 data-[size=lg]:w-10 data-unchecked:bg-bg-neutral-bold data-unchecked:hover:bg-bg-neutral-bold-hovered data-unchecked:active:bg-bg-neutral-bold-pressed data-checked:bg-success data-checked:hover:bg-success-hovered data-checked:active:bg-success-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3 user-invalid:border-destructive user-invalid:ring-destructive/20 user-invalid:ring-3 group-has-disabled/field:pointer-events-none group-has-disabled/field:cursor-not-allowed group-has-disabled/field:bg-bg-disabled group-has-disabled/field:hover:bg-bg-disabled group-has-disabled/field:active:bg-bg-disabled data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:bg-bg-disabled data-disabled:hover:bg-bg-disabled data-disabled:active:bg-bg-disabled",
				className
			)}
			{...props}
			aria-label={label ?? ariaLabel}
			disabled={disabled}
			{...controlledProps}
		>
			<Icon
				aria-hidden="true"
				render={<CrossIcon label="" size="small" color="currentColor" />}
				label="Off"
				className="pointer-events-none absolute top-1/2 right-[3px] -translate-y-1/2 text-icon-inverse transition-opacity duration-medium ease-out [&_svg]:size-full group-data-[size=sm]/switch:right-0.5 group-data-[size=sm]/switch:scale-75 group-data-unchecked/switch:opacity-100 group-data-checked/switch:opacity-0 group-data-disabled/switch:text-icon-disabled group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=lg]/switch:size-5"
			/>
			<Icon
				aria-hidden="true"
				render={<CheckMarkIcon label="" size="small" color="currentColor" />}
				label="On"
				className="pointer-events-none absolute top-1/2 left-[3px] -translate-y-1/2 text-icon-inverse transition-opacity duration-medium ease-out [&_svg]:size-full group-data-[size=sm]/switch:scale-75 group-data-checked/switch:opacity-100 group-data-unchecked/switch:opacity-0 group-data-disabled/switch:text-icon-disabled group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=lg]/switch:size-5"
			/>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="bg-surface rounded-full pointer-events-none block ring-0 absolute left-1 top-1/2 -translate-y-1/2 transition-transform duration-medium ease-out group-data-[size=default]/switch:size-3 group-data-[size=sm]/switch:size-2 group-data-[size=lg]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3 group-data-[size=lg]/switch:data-checked:translate-x-5 group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 group-data-[size=lg]/switch:data-unchecked:translate-x-0"
			/>
		</SwitchPrimitive.Root>
	)
}

export { Switch }
