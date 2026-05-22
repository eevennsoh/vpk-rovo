import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import WarningIcon from "@atlaskit/icon/core/status-warning"
import ErrorIcon from "@atlaskit/icon/core/status-error"
import MegaphoneIcon from "@atlaskit/icon/core/megaphone"

import { cn } from "@/lib/utils"

const bannerVariants = cva(
	"flex w-full items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium",
	{
		variants: {
			variant: {
				warning:
					"bg-warning text-warning-foreground",
				error:
					"bg-destructive text-destructive-foreground",
				announcement:
					"bg-bg-neutral-bold text-text-inverse",
			},
		},
		defaultVariants: {
			variant: "warning",
		},
	}
)

const bannerIcons: Record<string, React.ComponentType<{ label: string }>> = {
	warning: WarningIcon,
	error: ErrorIcon,
	announcement: MegaphoneIcon,
}

interface BannerProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof bannerVariants> {}

function Banner({ className, variant = "warning", children, ...props }: Readonly<BannerProps>) {
	const Icon = bannerIcons[variant ?? "warning"]
	// Only urgent variants warrant an immediate, assertive SR announcement.
	// Informational banners (e.g. "announcement") use `status` + polite.
	const isUrgent = variant === "warning" || variant === "error"

	return (
		<div
			data-slot="banner"
			role={isUrgent ? "alert" : "status"}
			aria-live={isUrgent ? "assertive" : "polite"}
			className={cn(bannerVariants({ variant }), className)}
			{...props}
		>
			{Icon ? <Icon label="" /> : null}
			<span>{children}</span>
		</div>
	)
}

export { Banner, bannerVariants, type BannerProps }
