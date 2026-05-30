import * as React from "react"
import InformationCircleIcon from "@atlaskit/icon/core/information-circle"
import { token } from "@/lib/tokens"
import { cn } from "@/lib/utils"

interface FooterProps extends React.ComponentProps<"div"> {
	/** Hide the information icon */
	hideIcon?: boolean
}

function Footer({
	className,
	hideIcon = false,
	children,
	...props
}: Readonly<FooterProps>) {
	return (
		<div
			data-slot="footer"
			className={cn(
				"flex items-center justify-center gap-1 py-2 text-xs text-text-subtlest",
				className,
			)}
			{...props}
		>
			{hideIcon ? null : (
				<InformationCircleIcon
					label=""
					color={token("color.icon.subtlest")}
					size="small"
				/>
			)}
			{children ?? <span>Uses AI. Verify results.</span>}
		</div>
	)
}

export { Footer, type FooterProps }
