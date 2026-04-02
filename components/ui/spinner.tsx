"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
	"pointer-events-none shrink-0",
	{
		variants: {
			size: {
				xs: "size-3",
				sm: "size-3.5",
				default: "size-4",
				lg: "size-5",
				xl: "size-6",
			},
			variant: {
				inherit: "",
				invert: "text-background",
			},
		},
		defaultVariants: {
			size: "default",
			variant: "inherit",
		},
	}
)

interface SpinnerProps
	extends VariantProps<typeof spinnerVariants> {
	className?: string
	label?: string
}

function Spinner({
	className,
	size = "default",
	variant = "inherit",
	label = "Loading",
}: Readonly<SpinnerProps>) {
	return (
		<svg
			data-slot="spinner"
			role="status"
			aria-label={label}
			viewBox="0 0 50 50"
			fill="none"
			className={cn(spinnerVariants({ size, variant }), className)}
		>
			<motion.circle
				cx="25"
				cy="25"
				r="20"
				stroke="currentColor"
				strokeWidth="4"
				strokeLinecap="round"
				fill="none"
				transform="rotate(-90 25 25)"
				animate={{
					pathLength: [0.05, 0.5, 0.05],
					pathOffset: [0, 0, 1],
				}}
				transition={{
					duration: 0.8,
					repeat: Infinity,
					times: [0, 0.2, 1],
					ease: ["easeOut", "easeOut"],
				}}
			/>
		</svg>
	)
}

export { Spinner, spinnerVariants, type SpinnerProps }
