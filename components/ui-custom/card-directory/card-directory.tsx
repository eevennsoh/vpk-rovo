"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { CARD_HOVER_TRANSITION, useCardInteraction } from "./use-card-interaction";

export interface CardDirectoryProps {
	/** Invoked on click / Enter / Space. Presence makes the card a button. */
	onSelect?: () => void;
	/** Accessible label for the button role when interactive. */
	selectLabel?: string;
	className?: string;
	children: ReactNode;
}

/**
 * Base directory-card shell — a bordered surface with hover elevation and an
 * optional keyboard-operable button contract. Compose content with
 * `CardDirectoryHeader`, `CardDirectoryDescription`, `CardDirectoryFooter`, etc.,
 * or use a ready-made variant wrapper (`CardDirectoryAgent`, `CardDirectorySkill`,
 * `CardDirectoryTool`, `CardDirectoryTemplate`).
 */
export function CardDirectory({
	onSelect,
	selectLabel = "Select item",
	className,
	children,
}: Readonly<CardDirectoryProps>) {
	const { interactive, hoverAnimation, tapAnimation, handleSelect, handleKeyDown } =
		useCardInteraction(onSelect);

	const cardMotionProps = {
		className: cn(
			"group/card flex h-full w-full flex-col gap-3 rounded-md border border-border bg-surface p-4 text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
			interactive && "cursor-pointer",
			className,
		),
		style: { willChange: "transform" },
		transition: CARD_HOVER_TRANSITION,
		whileHover: hoverAnimation,
	};

	if (interactive) {
		return (
			<motion.article
				aria-label={selectLabel}
				data-slot="card-directory"
				onClick={handleSelect}
				onKeyDown={handleKeyDown}
				role="button"
				tabIndex={0}
				whileTap={tapAnimation}
				{...cardMotionProps}
			>
				{children}
			</motion.article>
		);
	}

	return (
		<motion.article data-slot="card-directory" {...cardMotionProps}>
			{children}
		</motion.article>
	);
}
