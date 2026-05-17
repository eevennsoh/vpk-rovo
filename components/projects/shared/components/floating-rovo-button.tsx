"use client";

import Image from "next/image";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CrossIcon from "@atlaskit/icon/core/cross";
import { AnimatePresence, motion } from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { token } from "@/lib/tokens";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";

export interface FloatingRovoButtonSuggestion {
	id: string;
	label: string;
	ariaLabel?: string;
	onSelect: () => void;
	onDismiss?: () => void;
}

interface FloatingRovoButtonProps {
	product: Product;
	embedded?: boolean;
	forceVisible?: boolean;
	suggestion?: FloatingRovoButtonSuggestion | null;
}

function FloatingRovoButtonNudge({
	suggestion,
}: Readonly<{
	suggestion: FloatingRovoButtonSuggestion;
}>) {
	return (
		<motion.div
			key={suggestion.id}
			className="fixed right-[84px] bottom-7 z-[510] flex w-[420px] max-w-[calc(100vw-112px)] origin-right items-center justify-between overflow-hidden rounded-lg p-1 text-text-inverse"
			initial={{ opacity: 0, scaleX: 0.24, x: 52 }}
			animate={{ opacity: 1, scaleX: 1, x: 0 }}
			exit={{ opacity: 0, scaleX: 0.24, x: 52 }}
			transition={{
				opacity: { duration: 0.12, ease: [0, 0, 0.2, 1] },
				scaleX: { type: "spring", bounce: 0, visualDuration: 0.28 },
				x: { type: "spring", bounce: 0, visualDuration: 0.28 },
			}}
			style={{
				backgroundColor: token("color.background.neutral.bold"),
				boxShadow: token("elevation.shadow.overlay"),
				transformOrigin: "right center",
				willChange: "transform, opacity",
			}}
		>
			<button
				aria-label={suggestion.ariaLabel ?? suggestion.label}
				className="flex min-h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
				onClick={suggestion.onSelect}
				type="button"
			>
				<AiAgentIcon color={token("color.icon.inverse")} label="" size="small" />
				<span className="min-w-0 truncate">{suggestion.label}</span>
			</button>
			{suggestion.onDismiss ? (
				<button
					aria-label={`Dismiss ${suggestion.label}`}
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
					onClick={(event) => {
						event.stopPropagation();
						suggestion.onDismiss?.();
					}}
					type="button"
				>
					<CrossIcon color={token("color.icon.inverse")} label="" size="small" />
				</button>
			) : null}
		</motion.div>
	);
}

export default function FloatingRovoButton({
	product,
	embedded = false,
	forceVisible = false,
	suggestion,
}: Readonly<FloatingRovoButtonProps>) {
	const { isOpen, openChat } = useRovoChat();
	const shouldShowButton = forceVisible || !isOpen;

	if (!forceVisible && (embedded || product === "rovo")) {
		return null;
	}

	return (
		<>
			<style
				dangerouslySetInnerHTML={{
					__html: `
          .floating-rovo-button {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 48px;
            height: 48px;
            border-radius: ${token("radius.xxlarge")};
            background-color: ${token("color.background.neutral.bold")};
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transform-origin: center;
            will-change: transform;
            transition:
              background-color var(--duration-medium) var(--ease-out);
            z-index: 510;
            box-shadow: ${token("elevation.shadow.overlay")};
          }

          .floating-rovo-button img {
            width: 24px;
            height: 24px;
            pointer-events: none;
          }
        `,
				}}
			/>

			<AnimatePresence>
				{suggestion && shouldShowButton ? (
					<FloatingRovoButtonNudge key={suggestion.id} suggestion={suggestion} />
				) : null}
				{shouldShowButton ? (
					<motion.button
						key="floating-rovo-button-control"
						className="floating-rovo-button"
						type="button"
						initial={{ opacity: 0, scale: 0.92, y: 8 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.92, y: 8 }}
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.98 }}
						transition={{ duration: 0.18, ease: [0, 0.4, 0, 1] }}
						onClick={() => openChat("floating")}
						aria-label="Open Rovo"
					>
						<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
					</motion.button>
				) : null}
			</AnimatePresence>
		</>
	);
}
