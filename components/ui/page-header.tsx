import * as React from "react"

import { cn } from "@/lib/utils"
import { token } from "@/lib/tokens"

export interface PageHeaderProps extends Omit<React.ComponentProps<"header">, "title"> {
	title: React.ReactNode
	description?: React.ReactNode
	actions?: React.ReactNode
	breadcrumbs?: React.ReactNode
	bottomBar?: React.ReactNode
}

function PageHeader({
	title,
	description,
	actions,
	breadcrumbs,
	bottomBar,
	className,
	...props
}: Readonly<PageHeaderProps>) {
	return (
		<header
			data-slot="page-header"
			className={cn("w-full min-w-0", className)}
			{...props}
		>
			{breadcrumbs ? <div>{breadcrumbs}</div> : null}
			<div className="flex min-w-0 items-start">
				<div className="mb-2 min-w-0 flex-1 space-y-1">
					<h1 className="text-text" style={{ font: token("font.heading.large") }}>
						{title}
					</h1>
					{description ? <p className="text-text-subtle text-sm">{description}</p> : null}
				</div>
				{actions ? (
					<div className="mb-2 flex max-w-full shrink-0 items-center gap-1 pl-8">
						{actions}
					</div>
				) : null}
			</div>
			{bottomBar ? <div className="mt-4">{bottomBar}</div> : null}
		</header>
	)
}

export { PageHeader }
