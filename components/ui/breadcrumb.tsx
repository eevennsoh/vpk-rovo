import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal"

interface BreadcrumbLabelSlots {
	before?: React.ReactNode
	after?: React.ReactNode
}

interface BreadcrumbLabelProps
	extends React.ComponentProps<"span">,
		BreadcrumbLabelSlots {}

type BreadcrumbLinkProps = useRender.ComponentProps<"a"> & BreadcrumbLabelSlots

interface BreadcrumbPageProps
	extends React.ComponentProps<"span">,
		BreadcrumbLabelSlots {}

const breadcrumbLabelSlotClassName =
	"inline-flex size-3 shrink-0 items-center justify-center leading-none [&_[data-slot=icon-tile]]:size-3! [&_[data-slot=icon]]:size-3! [&_[data-slot=icon]>span]:size-3! [&_[data-slot=icon]>span]:inline-flex! [&_[data-slot=icon]>span]:items-center! [&_[data-slot=icon]>span]:justify-center! [&_[data-slot=icon]_svg]:size-3! [&_[data-slot=tile]]:size-3!"

function hasLabelSlots({ before, after }: BreadcrumbLabelSlots) {
	return before !== undefined || after !== undefined
}

function getLabelChildren(
	render: BreadcrumbLinkProps["render"],
	children: React.ReactNode
) {
	if (children !== undefined) {
		return children
	}

	if (React.isValidElement<{ children?: React.ReactNode }>(render)) {
		return render.props.children
	}

	return children
}

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="breadcrumb"
			data-slot="breadcrumb"
			className={className}
			{...props}
		/>
	)
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn(
				"text-foreground gap-1.5 text-xs flex flex-wrap items-center wrap-break-word",
				className
			)}
			{...props}
		/>
	)
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-item"
			className={cn("gap-1 inline-flex items-center", className)}
			{...props}
		/>
	)
}

function BreadcrumbLabel({
	before,
	after,
	className,
	children,
	...props
}: Readonly<BreadcrumbLabelProps>) {
	return (
		<span
			data-slot="breadcrumb-label"
			className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
			{...props}
		>
			{before ? (
				<span
					data-slot="breadcrumb-label-before"
					className={breadcrumbLabelSlotClassName}
				>
					{before}
				</span>
			) : null}
			<span data-slot="breadcrumb-label-text" className="min-w-0">
				{children}
			</span>
			{after ? (
				<span
					data-slot="breadcrumb-label-after"
					className={breadcrumbLabelSlotClassName}
				>
					{after}
				</span>
			) : null}
		</span>
	)
}

function BreadcrumbLink({
	before,
	after,
	children,
	className,
	render,
	...props
}: Readonly<BreadcrumbLinkProps>) {
	const content = hasLabelSlots({ before, after }) ? (
		<BreadcrumbLabel before={before} after={after}>
			{getLabelChildren(render, children)}
		</BreadcrumbLabel>
	) : (
		children
	)

	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				className: cn(
					"inline-flex min-w-0 items-center text-current transition-colors hover:text-current",
					className
				),
				...(content !== undefined ? { children: content } : {}),
			},
			props
		),
		render,
		state: {
			slot: "breadcrumb-link",
		},
	})
}

function BreadcrumbPage({
	before,
	after,
	className,
	children,
	...props
}: Readonly<BreadcrumbPageProps>) {
	const content = hasLabelSlots({ before, after }) ? (
		<BreadcrumbLabel before={before} after={after}>
			{children}
		</BreadcrumbLabel>
	) : (
		children
	)

	return (
		<span
			data-slot="breadcrumb-page"
			role="link"
			aria-disabled="true"
			aria-current="page"
			className={cn("text-foreground font-normal", className)}
			{...props}
		>
			{content}
		</span>
	)
}

function BreadcrumbSeparator({
	children,
	className,
	...props
}: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-separator"
			role="presentation"
			aria-hidden="true"
			className={cn(
				"flex items-center px-0.5 select-none [&>svg]:size-3",
				className
			)}
			{...props}
		>
			{children ?? "/"}
		</li>
	)
}

function BreadcrumbEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			aria-hidden="true"
			className={cn(
				"size-3 flex items-center justify-center [&_[data-slot=icon]]:size-3! [&_[data-slot=icon]>span]:size-3! [&_[data-slot=icon]>span]:inline-flex! [&_[data-slot=icon]>span]:items-center! [&_[data-slot=icon]>span]:justify-center! [&_[data-slot=icon]_svg]:size-3! [&>svg]:size-3",
				className
			)}
			{...props}
		>
			<Icon
				aria-hidden
				render={<ShowMoreHorizontalIcon label="" size="small" />}
			/>
			<span className="sr-only">More</span>
		</span>
	)
}

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLabel,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
}
