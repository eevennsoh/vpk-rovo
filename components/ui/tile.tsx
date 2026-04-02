import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tileVariants = cva(
	"inline-flex items-center justify-center overflow-hidden rounded-tile leading-none",
	{
		variants: {
			size: {
				xxsmall: "size-4 text-[10px]",
				xsmall: "size-5 text-xs",
				small: "size-6 text-sm",
				medium: "size-8 text-base",
				large: "size-10 text-xl",
				xlarge: "size-12 text-2xl",
			},
			variant: {
				// Semantic
				neutral: "bg-bg-neutral",
				brand: "bg-bg-brand-bold text-text-inverse",
				danger: "bg-bg-danger text-text-danger",
				warning: "bg-bg-warning text-text-warning",
				success: "bg-bg-success text-text-success",
				discovery: "bg-bg-discovery text-text-discovery",
				information: "bg-bg-information text-text-information",
				transparent: "bg-transparent",
				// Accent subtle
				blueSubtle: "bg-blue-50 text-blue-600",
				redSubtle: "bg-red-50 text-red-600",
				greenSubtle: "bg-green-50 text-green-600",
				yellowSubtle: "bg-yellow-50 text-yellow-600",
				purpleSubtle: "bg-purple-50 text-purple-600",
				tealSubtle: "bg-teal-50 text-teal-600",
				orangeSubtle: "bg-orange-50 text-orange-600",
				magentaSubtle: "bg-pink-50 text-pink-600",
				limeSubtle: "bg-lime-50 text-lime-600",
				graySubtle: "bg-neutral-50 text-neutral-600",
				// Accent bold
				blueBold: "bg-blue-600 text-text-inverse",
				redBold: "bg-red-600 text-text-inverse",
				greenBold: "bg-green-600 text-text-inverse",
				yellowBold: "bg-yellow-600 text-text-inverse",
				purpleBold: "bg-purple-600 text-text-inverse",
				tealBold: "bg-teal-600 text-text-inverse",
				orangeBold: "bg-orange-600 text-text-inverse",
				magentaBold: "bg-pink-600 text-text-inverse",
				limeBold: "bg-lime-600 text-text-inverse",
				grayBold: "bg-neutral-600 text-text-inverse",
			},
		},
		defaultVariants: {
			size: "medium",
			variant: "neutral",
		},
	}
)

const INSET_CHILD_SIZES = {
	xxsmall: "[&_img]:size-2.5 [&_svg]:size-2.5",
	xsmall: "[&_img]:size-3 [&_svg]:size-3",
	small: "[&_img]:size-3.5 [&_svg]:size-3.5",
	medium: "[&_img]:size-4 [&_svg]:size-4",
	large: "[&_img]:size-5 [&_svg]:size-5",
	xlarge: "[&_img]:size-6 [&_svg]:size-6",
} as const satisfies Record<string, string>

export interface TileProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof tileVariants> {
	label: string
	isInset?: boolean
	hasBorder?: boolean
}

function Tile({
	label,
	size = "medium",
	variant = "neutral",
	isInset = true,
	hasBorder = false,
	className,
	children,
	...props
}: Readonly<TileProps>) {
	const isDecorative = props["aria-hidden"] === true

	return (
		<div
			data-slot="tile"
			aria-label={isDecorative ? undefined : label}
			className={cn(
				tileVariants({ size, variant }),
			isInset
			? cn("p-0.5", INSET_CHILD_SIZES[size ?? "medium"])
			: "[&_span]:flex [&_span]:size-full [&_span]:items-center [&_span]:justify-center [&_img]:size-full [&_svg]:size-full",
				hasBorder && "border border-border",
				className
			)}
			{...props}
		>
			{children}
		</div>
	)
}

export { Tile, tileVariants }
