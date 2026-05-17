"use client";

import type { CarouselApi } from "@/components/ui/carousel";
import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
} from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useState,
} from "react";

export type InlineCitationProps = ComponentProps<"span">;

export function InlineCitation({
	className,
	...props
}: Readonly<InlineCitationProps>) {
	return (
		<span
			className={cn("group inline items-center gap-1", className)}
			{...props}
		/>
	);
}

export type InlineCitationTextProps = ComponentProps<"span">;

export function InlineCitationText({
	className,
	...props
}: Readonly<InlineCitationTextProps>) {
	return (
		<span
			className={cn("transition-colors group-hover:bg-accent", className)}
			{...props}
		/>
	);
}

export type InlineCitationCardProps = ComponentProps<typeof HoverCard>;

export function InlineCitationCard(props: Readonly<InlineCitationCardProps>) {
	return <HoverCard closeDelay={0} openDelay={0} {...props} />;
}

export interface InlineCitationCardTriggerProps
	extends ComponentProps<typeof Badge> {
	sources: string[];
}

export function InlineCitationCardTrigger({
	sources,
	className,
	...props
}: Readonly<InlineCitationCardTriggerProps>) {
	return (
		<HoverCardTrigger
			render={
				<Badge
					className={cn("ml-1 rounded-full", className)}
					variant="secondary"
					{...props}
				/>
			}
		>
			{sources[0] ? (
				<>
					{new URL(sources[0]).hostname}{" "}
					{sources.length > 1 ? `+${sources.length - 1}` : null}
				</>
			) : (
				"unknown"
			)}
		</HoverCardTrigger>
	);
}

export type InlineCitationCardBodyProps = ComponentProps<"div">;

export function InlineCitationCardBody({
	className,
	...props
}: Readonly<InlineCitationCardBodyProps>) {
	return (
		<HoverCardContent
			className={cn("relative w-80 p-0", className)}
			{...props}
		/>
	);
}

const CarouselApiContext = createContext<CarouselApi | undefined>(undefined);

function useCarouselApi() {
	return use(CarouselApiContext);
}

export type InlineCitationCarouselProps = ComponentProps<typeof Carousel>;

export function InlineCitationCarousel({
	className,
	children,
	...props
}: Readonly<InlineCitationCarouselProps>) {
	const [api, setApi] = useState<CarouselApi>();

	return (
		<CarouselApiContext value={api}>
			<Carousel className={cn("w-full", className)} setApi={setApi} {...props}>
				{children}
			</Carousel>
		</CarouselApiContext>
	);
}

export type InlineCitationCarouselContentProps = ComponentProps<"div">;

export function InlineCitationCarouselContent(
	props: Readonly<InlineCitationCarouselContentProps>,
) {
	return <CarouselContent {...props} />;
}

export type InlineCitationCarouselItemProps = ComponentProps<"div">;

export function InlineCitationCarouselItem({
	className,
	...props
}: Readonly<InlineCitationCarouselItemProps>) {
	return (
		<CarouselItem
			className={cn("w-full space-y-2 p-4 pl-8", className)}
			{...props}
		/>
	);
}

export type InlineCitationCarouselHeaderProps = ComponentProps<"div">;

export function InlineCitationCarouselHeader({
	className,
	...props
}: Readonly<InlineCitationCarouselHeaderProps>) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-2 rounded-t-md bg-secondary p-2",
				className,
			)}
			{...props}
		/>
	);
}

export type InlineCitationCarouselIndexProps = ComponentProps<"div">;

export function InlineCitationCarouselIndex({
	children,
	className,
	...props
}: Readonly<InlineCitationCarouselIndexProps>) {
	const api = useCarouselApi();
	const [current, setCurrent] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!api) {
			return;
		}

		setCount(api.scrollSnapList().length);
		setCurrent(api.selectedScrollSnap() + 1);

		const handleSelect = () => {
			setCurrent(api.selectedScrollSnap() + 1);
		};

		api.on("select", handleSelect);

		return () => {
			api.off("select", handleSelect);
		};
	}, [api]);

	return (
		<div
			className={cn(
				"flex flex-1 items-center justify-end px-3 py-1 text-muted-foreground text-xs",
				className,
			)}
			{...props}
		>
			{children ?? `${current}/${count}`}
		</div>
	);
}

export type InlineCitationCarouselPrevProps = ComponentProps<"button">;

export function InlineCitationCarouselPrev({
	className,
	...props
}: Readonly<InlineCitationCarouselPrevProps>) {
	const api = useCarouselApi();

	const handleClick = useCallback(() => {
		api?.scrollPrev();
	}, [api]);

	return (
		<button
			aria-label="Previous"
			className={cn("shrink-0", className)}
			onClick={handleClick}
			type="button"
			{...props}
		>
			<ArrowLeftIcon className="size-4 text-muted-foreground" />
		</button>
	);
}

export type InlineCitationCarouselNextProps = ComponentProps<"button">;

export function InlineCitationCarouselNext({
	className,
	...props
}: Readonly<InlineCitationCarouselNextProps>) {
	const api = useCarouselApi();

	const handleClick = useCallback(() => {
		api?.scrollNext();
	}, [api]);

	return (
		<button
			aria-label="Next"
			className={cn("shrink-0", className)}
			onClick={handleClick}
			type="button"
			{...props}
		>
			<ArrowRightIcon className="size-4 text-muted-foreground" />
		</button>
	);
}

export interface InlineCitationSourceProps extends ComponentProps<"div"> {
	title?: string;
	url?: string;
	description?: string;
}

export function InlineCitationSource({
	title,
	url,
	description,
	className,
	children,
	...props
}: Readonly<InlineCitationSourceProps>) {
	return (
		<div className={cn("space-y-1", className)} {...props}>
			{title ? (
				<h4 className="truncate font-medium text-sm leading-tight">
					{title}
				</h4>
			) : null}
			{url ? (
				<p className="truncate break-all text-muted-foreground text-xs">
					{url}
				</p>
			) : null}
			{description ? (
				<p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
			) : null}
			{children}
		</div>
	);
}

export type InlineCitationQuoteProps = ComponentProps<"blockquote">;

export function InlineCitationQuote({
	children,
	className,
	...props
}: Readonly<InlineCitationQuoteProps>) {
	return (
		<blockquote
			className={cn(
				"border-muted border-l-2 pl-3 text-muted-foreground text-sm italic",
				className,
			)}
			{...props}
		>
			{children}
		</blockquote>
	);
}
