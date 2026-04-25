import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// ── CommentAction ────────────────────────────────────────────

interface CommentActionProps extends React.ComponentProps<"button"> {
	children: React.ReactNode
}

function CommentAction({
	className,
	children,
	...props
}: Readonly<CommentActionProps>) {
	return (
		<button
			type="button"
			data-slot="comment-action"
			className={cn(
				"text-text-subtle bg-transparent text-sm font-medium leading-5",
				"hover:underline",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	)
}

// ── Comment ──────────────────────────────────────────────────

export interface CommentProps extends React.ComponentProps<"article"> {
	author: string
	avatarSrc?: string
	time?: string
	edited?: boolean
	type?: string
	highlighted?: boolean
	isSaving?: boolean
	savingText?: string
	actions?: React.ReactNode
}

function Comment({
	className,
	author,
	avatarSrc,
	time,
	edited,
	type,
	highlighted,
	isSaving,
	savingText = "Saving...",
	actions,
	children,
	...props
}: Readonly<CommentProps>) {
	const initials =
		author
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"

	return (
		<article
			data-slot="comment"
			className={cn(
				"grid grid-cols-[32px_1fr] gap-2",
				highlighted && "bg-bg-neutral rounded-sm px-3 py-4",
				className,
			)}
			{...props}
		>
			<Avatar size="sm">
				{avatarSrc ? <AvatarImage src={avatarSrc} alt={author} /> : null}
				<AvatarFallback>{initials}</AvatarFallback>
			</Avatar>
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm leading-5">
					<span className="text-text-subtle font-medium">{author}</span>
					{type ? (
						<span className="bg-bg-neutral text-text rounded-xs px-1 py-px text-[11px] font-semibold leading-4">
							{type}
						</span>
					) : null}
					{isSaving ? (
						<span className="text-text-subtlest">{savingText}</span>
					) : (
						<>
							{time ? (
								<span className="text-text-subtle">{time}</span>
							) : null}
							{edited ? (
								<span className="text-text-subtlest">Edited</span>
							) : null}
						</>
					)}
				</div>
				{children ? (
					<div className="text-text text-sm leading-5">{children}</div>
				) : null}
				{!isSaving && actions ? (
					<div className="text-text-subtle mt-0.5 flex items-center gap-2 text-sm leading-5">
						{actions}
					</div>
				) : null}
			</div>
		</article>
	)
}

export { Comment, CommentAction, type CommentActionProps }
