import * as React from "react";

import CrossIcon from "@atlaskit/icon/core/cross";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import { cn } from "@/lib/utils";

type LegacyTagVariant = "success" | "removed" | "inprogress" | "new" | "moved";

type TagVariant = "default" | "rounded" | LegacyTagVariant;

type TagColor =
	| "standard"
	| "gray"
	| "grey"
	| "blue"
	| "green"
	| "red"
	| "yellow"
	| "purple"
	| "discovery"
	| "lime"
	| "magenta"
	| "orange"
	| "teal"
	| "grayLight"
	| "greyLight"
	| "blueLight"
	| "greenLight"
	| "redLight"
	| "yellowLight"
	| "purpleLight"
	| "limeLight"
	| "magentaLight"
	| "orangeLight"
	| "tealLight";

type ResolvedTagColor = "gray" | "blue" | "green" | "red" | "yellow" | "purple" | "discovery" | "lime" | "magenta" | "orange" | "teal";

type TagType = "default" | "user" | "other" | "agent";

const legacyVariantToColor: Record<TagVariant, TagColor> = {
	default: "standard",
	rounded: "standard",
	success: "green",
	removed: "red",
	inprogress: "blue",
	new: "purple",
	moved: "yellow",
};

const colorAliases: Record<TagColor, ResolvedTagColor> = {
	standard: "gray",
	gray: "gray",
	grey: "gray",
	grayLight: "gray",
	greyLight: "gray",
	blue: "blue",
	blueLight: "blue",
	green: "green",
	greenLight: "green",
	red: "red",
	redLight: "red",
	yellow: "yellow",
	yellowLight: "yellow",
	purple: "purple",
	discovery: "discovery",
	purpleLight: "purple",
	lime: "lime",
	limeLight: "lime",
	magenta: "magenta",
	magentaLight: "magenta",
	orange: "orange",
	orangeLight: "orange",
	teal: "teal",
	tealLight: "teal",
};

const tagColorClasses: Record<ResolvedTagColor, { border: string; icon: string }> = {
	gray: { border: "border-neutral-500", icon: "text-neutral-500" },
	blue: { border: "border-blue-500", icon: "text-blue-500" },
	green: { border: "border-green-500", icon: "text-green-400" },
	red: { border: "border-red-500", icon: "text-red-600" },
	yellow: { border: "border-yellow-400", icon: "text-yellow-400" },
	purple: { border: "border-purple-500", icon: "text-purple-500" },
	discovery: { border: "border-border-discovery", icon: "text-icon-discovery" },
	lime: { border: "border-lime-400", icon: "text-lime-400" },
	magenta: { border: "border-pink-500", icon: "text-pink-500" },
	orange: { border: "border-orange-400", icon: "text-orange-400" },
	teal: { border: "border-teal-400", icon: "text-teal-400" },
};

interface TagProps extends Omit<React.ComponentProps<"span">, "color"> {
	children: React.ReactNode;
	variant?: TagVariant;
	color?: TagColor;
	shape?: "default" | "rounded";
	type?: TagType;
	disabled?: boolean;
	onRemove?: () => void;
	removeButtonLabel?: string;
	elemBefore?: React.ReactNode;
	isVerified?: boolean;
	maxWidth?: React.CSSProperties["maxWidth"];
}

function Tag({
	children,
	variant = "default",
	color,
	shape = "default",
	type = "default",
	disabled = false,
	onRemove,
	removeButtonLabel = "Remove",
	elemBefore,
	isVerified = false,
	maxWidth,
	className,
	style,
	onClick,
	...props
}: Readonly<TagProps>) {
	const resolvedColor = colorAliases[color ?? legacyVariantToColor[variant]];
	const colorClasses = tagColorClasses[resolvedColor];
	const hasAvatarTagStyles = type !== "default" && Boolean(elemBefore);
	const isUserAvatarTag = hasAvatarTagStyles && type === "user";
	const isOtherAvatarTag = hasAvatarTagStyles && type === "other";
	const isAgentAvatarTag = hasAvatarTagStyles && type === "agent";
	const isRounded = shape === "rounded" || variant === "rounded";
	const isInteractive = Boolean(onClick);
	const shouldShowVerifiedIcon = isOtherAvatarTag && isVerified;
	const removeButtonShapeClass = isUserAvatarTag ? "rounded-full" : "rounded-xs";
	const removeButtonMarginClass = hasAvatarTagStyles ? "mr-[-2px]" : "-mx-0.5";

	const childText = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
	const resolvedRemoveButtonLabel = childText ? `${removeButtonLabel} ${childText}` : removeButtonLabel;
	const resolvedStyle = maxWidth !== undefined ? { ...style, maxWidth } : style;

	return (
		<span
			{...props}
			onClick={onClick}
			style={resolvedStyle}
			className={cn(
				"relative inline-flex max-w-[11.25rem] min-w-0 shrink-0 self-start items-center border bg-bg-neutral-subtle text-xs leading-4 font-normal text-text transition-colors box-border",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				colorClasses.border,
				hasAvatarTagStyles
					? cn("h-6 gap-1 py-0 ps-0.5", isUserAvatarTag && "rounded-full pe-1.5", isOtherAvatarTag && "rounded-sm pe-1", isAgentAvatarTag && "rounded-sm pe-1")
					: cn("h-5 gap-1 px-[3px] py-0.5", isRounded ? "rounded-full" : "rounded-sm"),
				isInteractive ? "cursor-pointer hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed" : "cursor-default",
				disabled && "pointer-events-none opacity-(--opacity-disabled)",
				className,
			)}
			data-slot="tag"
			data-type={type}
			aria-disabled={disabled || undefined}
		>
			{elemBefore ? (
				<span
					className={cn(
						"flex shrink-0 items-center justify-center",
						hasAvatarTagStyles ? cn("size-5 overflow-hidden border border-transparent -ml-px [&>*]:size-full") : cn(colorClasses.icon, "[&>svg]:size-3"),
					)}
					data-slot="tag-before"
				>
					{elemBefore}
				</span>
			) : null}
			<span className="min-w-0 grow truncate whitespace-nowrap" data-tag-text>
				{children}
			</span>
			{shouldShowVerifiedIcon ? (
				<span className="ml-px inline-flex shrink-0 items-center text-blue-500" data-slot="tag-verified-icon">
					<StatusVerifiedIcon label="Verified" size="small" />
				</span>
			) : null}
			{onRemove ? (
				<span className="inline-flex shrink-0 items-center" data-slot="tag-after">
					<button
						type="button"
						aria-label={resolvedRemoveButtonLabel}
						disabled={disabled}
						onClick={(event) => {
							event.stopPropagation();
							onRemove();
						}}
						className={cn(
							"inline-flex size-4 shrink-0 items-center justify-center border-0 bg-bg-neutral-subtle text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none",
							removeButtonShapeClass,
							removeButtonMarginClass,
						)}
					>
						<CrossIcon label="" size="small" color="currentColor" />
					</button>
				</span>
			) : null}
		</span>
	);
}

type TagGroupProps = React.ComponentProps<"div">;

function TagGroup({ className, ...props }: Readonly<TagGroupProps>) {
	return <div data-slot="tag-group" className={cn("flex flex-wrap gap-2", className)} {...props} />;
}

export { Tag, TagGroup, type TagProps, type TagGroupProps, type TagVariant, type TagColor, type TagType };
