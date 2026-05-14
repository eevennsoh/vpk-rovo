"use client";

import Image from "next/image";
import { token } from "@/lib/tokens";
import { IconTile } from "@/components/ui/icon-tile";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";

interface ChatGreetingProps {
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
	suggestions,
	onSuggestionClick,
}: Readonly<ChatGreetingProps>) {
	const greetingSuggestions = suggestions ?? defaultSuggestions;

	return (
		<div className="w-[90%] max-w-[400px]">
			<div className="flex flex-col gap-6">
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
