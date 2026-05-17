"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { token } from "@/lib/tokens";
import Heading from "@/components/blocks/shared-ui/heading";
import { IconTile } from "@/components/ui/icon-tile";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";
import { isRovoAgentProfile, type RovoAgentProfile } from "@/components/projects/rovo/data/agent-profiles";
import { cn } from "@/lib/utils";

const DEFAULT_ILLUSTRATION_SRC = "/illustration-ai/chat/light.svg";
const DEFAULT_ILLUSTRATION_DARK_SRC = "/illustration-ai/chat/dark.svg";
const LIGHT_SVG_SUFFIX = "/light.svg";
const MAX_MODE_HEADING = "Let's plan your next move";
const MAX_MODE_ILLUSTRATION_SRC = "/illustration-ai/max/light.gif";
const MAX_MODE_ILLUSTRATION_DARK_SRC = "/illustration-ai/max/dark.gif";
const CHAT_GREETING_ILLUSTRATION_CLASS_NAME = "h-[67px] w-[74px]";
const CHAT_GREETING_MODE_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.14,
} as const;
const CHAT_GREETING_EXIT_TRANSITION = {
	duration: 0.08,
} as const;
const CHAT_GREETING_REDUCED_TRANSITION = {
	duration: 0.08,
} as const;
const CHAT_GREETING_CONTAINER_VARIANTS = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.04,
		},
	},
	exit: {
		transition: {
			staggerChildren: 0.02,
			staggerDirection: -1,
		},
	},
} as const;
const CHAT_GREETING_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
		transform: "translateY(6px)",
	},
	visible: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: CHAT_GREETING_MODE_TRANSITION,
	},
	exit: {
		opacity: 0,
		transform: "translateY(-6px)",
		transition: CHAT_GREETING_EXIT_TRANSITION,
	},
} as const;
const CHAT_GREETING_REDUCED_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: CHAT_GREETING_REDUCED_TRANSITION,
	},
	exit: {
		opacity: 0,
		transition: CHAT_GREETING_REDUCED_TRANSITION,
	},
} as const;

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
	/** Whether to render the Max-mode greeting and illustration. */
	isMaxMode?: boolean;
	/** Optional custom suggestions list */
	suggestions?: ReadonlyArray<RovoSuggestion>;
	/** Optional selected agent profile for custom-agent empty states. */
	selectedAgent?: RovoAgentProfile | null;
	/** Callback when a suggestion is clicked */
	onSuggestionClick?: (suggestion: RovoSuggestion) => void;
}

interface SkillListItemProps {
	suggestion: RovoSuggestion;
	onClick?: () => void;
}

function getPairedDarkIllustrationSrc(illustrationSrc: string): string {
	if (illustrationSrc.endsWith(LIGHT_SVG_SUFFIX)) {
		return `${illustrationSrc.slice(0, -LIGHT_SVG_SUFFIX.length)}/dark.svg`;
	}

	return DEFAULT_ILLUSTRATION_DARK_SRC;
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
				aria-hidden={true}
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

function CustomAgentStarterItem({
	suggestion,
	onClick,
}: Readonly<SkillListItemProps>) {
	const IconComponent = suggestion.icon;

	return (
		<button
			className="flex w-full items-center gap-4 rounded-lg p-[var(--ds-space-075)] text-left transition-colors hover:bg-bg-neutral-subtle-hovered"
			onClick={onClick}
			type="button"
		>
			<IconTile
				aria-hidden={true}
				className="border border-border bg-surface"
				icon={IconComponent ? <IconComponent label={suggestion.label} color={token("color.icon.subtle")} /> : null}
				label={suggestion.label}
				size="medium"
			/>
			<span className="min-w-0 flex-1 text-sm font-semibold leading-5 text-text-subtle">{suggestion.label}</span>
		</button>
	);
}

function CustomAgentGreeting({
	agent,
	onSuggestionClick,
}: Readonly<{
	agent: RovoAgentProfile;
	onSuggestionClick?: (suggestion: RovoSuggestion) => void;
}>) {
	return (
		<div className="flex w-full flex-col items-center gap-8 text-center">
			<div className="flex max-w-[360px] flex-col items-center gap-3">
				<Image alt="" aria-hidden className="size-10 object-contain" height={40} loading="eager" src={agent.avatarSrc} width={40} />
				<div className="flex flex-col items-center gap-2">
					<Heading size="large" className="text-center">{agent.name}</Heading>
					{agent.description ? (
						<p className="text-sm leading-6 text-text-subtle">{agent.description}</p>
					) : null}
				</div>
			</div>
			<div className="w-full">
				<div className="flex flex-col gap-1">
					{agent.starters.map((suggestion) => (
						<CustomAgentStarterItem
							key={suggestion.id}
							suggestion={suggestion}
							onClick={() => onSuggestionClick?.(suggestion)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

export default function ChatGreeting({
	heading = "How can I help?",
	illustrationSrc = DEFAULT_ILLUSTRATION_SRC,
	illustrationDarkSrc,
	isMaxMode = false,
	selectedAgent = null,
	showHero = true,
	suggestions,
	onSuggestionClick,
}: Readonly<ChatGreetingProps>) {
	const shouldReduceMotion = useReducedMotion();
	const customAgent = selectedAgent !== null && !isRovoAgentProfile(selectedAgent) ? selectedAgent : null;
	const greetingSuggestions = suggestions ?? defaultSuggestions;
	const resolvedHeading = isMaxMode ? MAX_MODE_HEADING : heading;
	const resolvedIllustrationSrc = isMaxMode ? MAX_MODE_ILLUSTRATION_SRC : illustrationSrc;
	const resolvedIllustrationDarkSrc = isMaxMode
		? MAX_MODE_ILLUSTRATION_DARK_SRC
		: illustrationDarkSrc ?? getPairedDarkIllustrationSrc(illustrationSrc);
	const heroKey = isMaxMode ? "max" : "default";
	const itemVariants = shouldReduceMotion ? CHAT_GREETING_REDUCED_ITEM_VARIANTS : CHAT_GREETING_ITEM_VARIANTS;

	if (customAgent) {
		return (
			<div className="w-full">
				<CustomAgentGreeting agent={customAgent} onSuggestionClick={onSuggestionClick} />
			</div>
		);
	}

	return (
		<div className="w-full">
			<div className="flex flex-col gap-6">
				{showHero ? (
					<AnimatePresence mode="wait">
						<motion.div
							animate="visible"
							className="flex flex-col items-center gap-2"
							exit="exit"
							initial="hidden"
							key={heroKey}
							variants={CHAT_GREETING_CONTAINER_VARIANTS}
						>
							<motion.div className={cn(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "relative")} style={{ willChange: "transform, opacity" }} variants={itemVariants}>
								<Image
									src={resolvedIllustrationSrc}
									alt=""
									width={74}
									height={67}
									loading="eager"
									className={cn(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "object-contain dark:hidden [[data-color-mode=dark]_&]:hidden")}
								/>
								<Image
									src={resolvedIllustrationDarkSrc}
									alt=""
									width={74}
									height={67}
									loading="eager"
									className={cn(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "hidden object-contain dark:block [[data-color-mode=dark]_&]:block")}
								/>
							</motion.div>
							<motion.div style={{ willChange: "transform, opacity" }} variants={itemVariants}>
								<Heading size="large" className="text-center">{resolvedHeading}</Heading>
							</motion.div>
						</motion.div>
					</AnimatePresence>
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
