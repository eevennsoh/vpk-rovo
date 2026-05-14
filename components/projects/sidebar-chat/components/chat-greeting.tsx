"use client";

import Image from "next/image";
import { token } from "@/lib/tokens";
import Heading from "@/components/blocks/shared-ui/heading";
import { IconTile } from "@/components/ui/icon-tile";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";

interface ChatGreetingProps {
	/** Optional custom heading text */
	heading?: string;
	/** Optional custom light-mode illustration src */
	illustrationSrc?: string;
	/** Optional custom dark-mode illustration src */
	illustrationDarkSrc?: string;
	/**
	 * Render the illustration + heading block above the suggestion list.
	 * Surfaces with constrained vertical space (e.g. the floating chat) can
	 * pass `false` to keep just the suggestions.
	 */
	showHero?: boolean;
	/** Optional custom suggestions list */
	suggestions?: ReadonlyArray<RovoSuggestion>;
	/** Callback when a suggestion is clicked */
	onSuggestionClick?: (suggestion: RovoSuggestion) => void;
}

interface SkillListItemProps {
	suggestion: RovoSuggestion;
	onClick?: () => void;
}

function SkillListItem({
	suggestion,
	onClick,
}: Readonly<SkillListItemProps>) {
	const IconComponent = suggestion.icon;
	const iconColor = suggestion.id === "work-last-7-days" || suggestion.id === "draft-confluence-page"
		? token("color.icon.accent.blue")
		: token("color.icon.subtlest");

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-3 rounded-lg p-[var(--ds-space-075)] transition-colors hover:bg-bg-neutral-subtle-hovered"
		>
			<IconTile
				size="medium"
				label={suggestion.label}
				className="border border-border bg-surface"
				icon={
					suggestion.imageSrc ? (
						<Image
							src={suggestion.imageSrc}
							alt={suggestion.label}
							width={16}
							height={16}
							className="size-4 object-contain"
						/>
					) : IconComponent ? (
						<IconComponent label={suggestion.label} color={iconColor} />
					) : null
				}
			/>
			<span className="text-left text-sm text-text-subtle">{suggestion.label}</span>
		</button>
	);
}

export default function ChatGreeting({
	heading = "How can I help?",
	illustrationSrc = "/illustration-ai/chat/light.svg",
	illustrationDarkSrc = "/illustration-ai/chat/dark.svg",
	showHero = true,
	suggestions,
	onSuggestionClick,
}: Readonly<ChatGreetingProps>) {
	const greetingSuggestions = suggestions ?? defaultSuggestions;

	return (
		<div className="w-[90%]">
			<div className="flex flex-col gap-6">
				{showHero ? (
					<div className="flex flex-col items-center gap-2">
						<Image
							src={illustrationSrc}
							alt=""
							width={80}
							height={80}
							loading="eager"
							className="h-auto w-auto object-contain dark:hidden"
						/>
						<Image
							src={illustrationDarkSrc}
							alt=""
							width={80}
							height={80}
							loading="eager"
							className="hidden h-auto w-auto object-contain dark:block"
						/>
						<Heading size="large" className="text-center">{heading}</Heading>
					</div>
				) : null}
				<div className="w-full">
					<div className="flex flex-col gap-1">
						{greetingSuggestions.map((suggestion) => (
							<SkillListItem
								key={suggestion.id}
								suggestion={suggestion}
								onClick={() => onSuggestionClick?.(suggestion)}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
