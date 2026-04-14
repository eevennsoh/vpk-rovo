"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ClickyExchange } from "@/components/projects/rovo-app/hooks/use-clicky";
import { token } from "@/lib/tokens";

// ---------------------------------------------------------------------------
// Clicky conversation history — small scrollable panel in the overlay.
// ---------------------------------------------------------------------------

interface ClickyHistoryPanelProps {
	history: ReadonlyArray<ClickyExchange>;
}

export function ClickyHistoryPanel({ history }: Readonly<ClickyHistoryPanelProps>) {
	if (history.length === 0) return null;

	return (
		<motion.div
			className="fixed bottom-20 right-4 flex w-72 flex-col gap-1.5 rounded-xl bg-surface-raised p-3"
			style={{
				boxShadow: token("elevation.shadow.overlay"),
				zIndex: 9999,
				maxHeight: 240,
				overflowY: "auto",
			}}
			initial={{ opacity: 0, y: 12, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 12, scale: 0.95 }}
			transition={{ type: "spring", damping: 25, stiffness: 300 }}
		>
			<div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-subtlest">
				Conversation
			</div>
			<AnimatePresence initial={false}>
				{history.map((exchange, i) => (
					<motion.div
						key={`${exchange.role}-${i}`}
						className={`rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
							exchange.role === "user"
								? "self-end bg-bg-brand-bold text-text-inverse"
								: "self-start bg-bg-neutral text-text"
						}`}
						style={{ maxWidth: "85%" }}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.15 }}
					>
						{exchange.content}
					</motion.div>
				))}
			</AnimatePresence>
		</motion.div>
	);
}
