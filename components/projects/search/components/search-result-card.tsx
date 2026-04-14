"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { highlightSearchTerms } from "../lib/highlight-search-terms";
import LinkIcon from "@atlaskit/icon/core/link";
import PagesIcon from "@atlaskit/icon/core/pages";
import RovoChatIcon from "@atlaskit/icon/core/rovo-chat";

interface SearchResultCardProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: React.ComponentType<any>;
	iconColor?: string;
	title: string;
	metadata: string[];
	excerpt: string;
	searchTerms?: string[];
	onClick?: () => void;
}

export default function SearchResultCard({
	icon: Icon = PagesIcon,
	iconColor = token("color.icon.information"),
	title,
	metadata,
	excerpt,
	searchTerms = [],
	onClick,
}: Readonly<SearchResultCardProps>) {
	const [isCardHovered, setIsCardHovered] = useState(false);
	const [isTitleHovered, setIsTitleHovered] = useState(false);

	return (
		<div
			role="group"
			style={{ display: "flex" }}
			onMouseEnter={() => setIsCardHovered(true)}
			onMouseLeave={() => setIsCardHovered(false)}
			onFocus={() => setIsCardHovered(true)}
			onBlur={() => setIsCardHovered(false)}
		>
			<ResultIcon Icon={Icon} iconColor={iconColor} title={title} />

			<div className="flex min-w-0 flex-1 flex-col gap-1 px-3">
				<div className="flex items-start gap-2">
					<button
						type="button"
						onClick={onClick}
						style={{
							font: token("font.body.large"),
							color: token("color.text.brand"),
							textDecoration: isTitleHovered ? "underline" : "none",
							cursor: "pointer",
							background: "none",
							border: "none",
							padding: 0,
							textAlign: "left",
						}}
						onMouseEnter={() => setIsTitleHovered(true)}
						onMouseLeave={() => setIsTitleHovered(false)}
					>
						{highlightSearchTerms(title, searchTerms)}
					</button>

					{isCardHovered ? <HoverActions /> : null}
				</div>

				<ResultMetadata metadata={metadata} />

				<div
					style={{
						font: token("font.body"),
						color: token("color.text.subtle"),
						lineHeight: "20px",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{highlightSearchTerms(excerpt, searchTerms)}
				</div>
			</div>
		</div>
	);
}

interface ResultIconProps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	Icon: React.ComponentType<any>;
	iconColor: string;
	title: string;
}

function ResultIcon({ Icon, iconColor, title }: Readonly<ResultIconProps>) {
	return (
		<div className="px-2">
			<div
				className="flex size-8 items-center justify-center bg-bg-neutral"
				style={{ borderRadius: token("radius.medium") }}
			>
				<Icon label={title} color={iconColor} />
			</div>
		</div>
	);
}

function HoverActions() {
	return (
		<div className="flex shrink-0" style={{ gap: token("space.050") }}>
			<Button
				aria-label="Copy link"
				size="icon-sm"
				variant="secondary"
				onClick={(e) => e.stopPropagation()}
			>
				<LinkIcon label="" size="small" />
			</Button>
			<Button
				className="gap-2"
				size="sm"
				variant="secondary"
				onClick={(e) => e.stopPropagation()}
			>
				<RovoChatIcon label="" size="small" />
				Summarize
			</Button>
		</div>
	);
}

interface ResultMetadataProps {
	metadata: string[];
}

function ResultMetadata({ metadata }: Readonly<ResultMetadataProps>) {
	return (
		<div
			className="flex flex-wrap items-center"
			style={{
				font: token("font.body"),
				color: token("color.text.subtlest"),
				gap: token("space.100"),
			}}
		>
			{metadata.map((item, index) => (
				<span key={index} className="flex items-center" style={{ gap: token("space.100") }}>
					{index > 0 ? (
						<span
							className="inline-block size-1 rounded-full"
							style={{ backgroundColor: token("color.text.subtlest") }}
						/>
					) : null}
					<span>{item}</span>
				</span>
			))}
		</div>
	);
}
