import { cn } from "@/lib/utils"

export interface ObjectTileProps extends Omit<React.ComponentProps<"div">, "title"> {
	icon?: React.ReactNode
	title: string
	description?: string
	meta?: React.ReactNode
	action?: React.ReactNode
	href?: string
	hasBorder?: boolean
}

function ObjectTile({
	icon,
	title,
	description,
	meta,
	action,
	href,
	hasBorder = true,
	className,
	...props
}: Readonly<ObjectTileProps>) {
	const content = (
		<>
			{icon ? <div data-slot="icon" className="shrink-0">{icon}</div> : null}
			<div data-slot="text" className="min-w-0 flex-1">
				<p data-slot="title" className="truncate text-sm font-medium text-text">
					{title}
				</p>
				{description ? (
					<p data-slot="description" className="truncate text-xs text-text-subtle">
						{description}
					</p>
				) : null}
			</div>
			{meta ? <div data-slot="meta" className="shrink-0 text-xs text-text-subtle">{meta}</div> : null}
			{action ? <div data-slot="action" className="shrink-0">{action}</div> : null}
		</>
	)

	const sharedClassName = cn(
		"flex items-center gap-3 rounded-lg px-3 py-2",
		hasBorder && "border border-border",
		href
			? "no-underline bg-surface hover:bg-surface-hovered active:bg-surface-pressed transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
			: "bg-surface",
		className
	)

	if (href) {
		return (
			<a
				data-slot="object-tile"
				href={href}
				className={sharedClassName}
				{...(props as React.ComponentProps<"a">)}
			>
				{content}
			</a>
		)
	}

	return (
		<div data-slot="object-tile" className={sharedClassName} {...props}>
			{content}
		</div>
	)
}

export { ObjectTile }
