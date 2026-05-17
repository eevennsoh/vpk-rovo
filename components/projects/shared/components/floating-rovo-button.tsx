"use client";

import { type CSSProperties, useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CrossIcon from "@atlaskit/icon/core/cross";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";
export type FloatingRovoButtonOnboardingStatus = "idle" | "creating" | "created";

export interface FloatingRovoButtonSuggestion {
	id: string;
	label: string;
	ariaLabel?: string;
	onSelect: () => void;
	onDismiss?: () => void;
}

export interface FloatingRovoButtonOnboardingConfig {
	id: string;
	title: string;
	agentName: string;
	byline: string;
	description: string;
	prompt: string;
	primaryActionLabel: string;
	secondaryActionLabel: string;
	avatarSrc?: string;
	avatarAlt?: string;
	coverSrc?: string;
	coverBackgroundColor?: string;
	closeLabel?: string;
	status?: FloatingRovoButtonOnboardingStatus;
	statusLabel?: string;
	primaryActionDisabled?: boolean;
	open?: boolean;
	defaultOpen?: boolean;
	openOnButtonClick?: boolean;
	onOpenChange?: (open: boolean) => void;
	onPrimaryAction?: () => void;
	onSecondaryAction?: () => void;
}

export interface FloatingRovoButtonPlacement {
	right?: string;
	bottom?: string;
}

interface FloatingRovoButtonProps {
	product: Product;
	embedded?: boolean;
	forceVisible?: boolean;
	ariaLabel?: string;
	placement?: FloatingRovoButtonPlacement;
	onButtonClick?: () => void;
	suggestion?: FloatingRovoButtonSuggestion | null;
	onboarding?: FloatingRovoButtonOnboardingConfig | null;
}

const DEFAULT_BUTTON_RIGHT = "24px";
const DEFAULT_BUTTON_BOTTOM = "24px";

function resolveFloatingRovoButtonPlacement(placement?: FloatingRovoButtonPlacement): Required<FloatingRovoButtonPlacement> {
	return {
		right: placement?.right ?? DEFAULT_BUTTON_RIGHT,
		bottom: placement?.bottom ?? DEFAULT_BUTTON_BOTTOM,
	};
}

function getFloatingRovoButtonPlacementStyle(
	placement?: FloatingRovoButtonPlacement,
): CSSProperties {
	const resolvedPlacement = resolveFloatingRovoButtonPlacement(placement);

	return {
		"--floating-rovo-button-right": resolvedPlacement.right,
		"--floating-rovo-button-bottom": resolvedPlacement.bottom,
	} as CSSProperties;
}

function FloatingRovoButtonNudge({
	suggestion,
	placement,
}: Readonly<{
	suggestion: FloatingRovoButtonSuggestion;
	placement?: FloatingRovoButtonPlacement;
}>) {
	const resolvedPlacement = resolveFloatingRovoButtonPlacement(placement);

	return (
		<motion.div
			key={suggestion.id}
			className={cn(
				"fixed z-[510] flex w-fit max-w-[calc(100vw-112px)] origin-right items-center gap-1 overflow-hidden rounded-lg p-1 text-text-inverse",
				placement ? null : "right-[84px] bottom-7",
			)}
			initial={{ opacity: 0, scaleX: 0.24, x: 52 }}
			animate={{ opacity: 1, scaleX: 1, x: 0 }}
			exit={{ opacity: 0, scaleX: 0.24, x: 52 }}
			transition={{
				opacity: { duration: 0.12, ease: [0, 0, 0.2, 1] },
				scaleX: { type: "spring", bounce: 0, visualDuration: 0.28 },
				x: { type: "spring", bounce: 0, visualDuration: 0.28 },
			}}
			style={{
				...(placement
					? {
							right: `calc(${resolvedPlacement.right} + 60px)`,
							bottom: `calc(${resolvedPlacement.bottom} + 4px)`,
						}
					: {}),
				backgroundColor: token("color.background.neutral.bold"),
				boxShadow: token("elevation.shadow.overlay"),
				transformOrigin: "right center",
				willChange: "transform, opacity",
			}}
		>
			<button
				aria-label={suggestion.ariaLabel ?? suggestion.label}
				className="flex min-h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-left text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
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

function FloatingRovoButtonOnboardingPanel({
	onboarding,
	onOpenChange,
	placement,
	shouldReduceMotion,
}: Readonly<{
	onboarding: FloatingRovoButtonOnboardingConfig;
	onOpenChange: (open: boolean) => void;
	placement?: FloatingRovoButtonPlacement;
	shouldReduceMotion: boolean;
}>) {
	const resolvedPlacement = resolveFloatingRovoButtonPlacement(placement);
	const titleId = `${onboarding.id}-title`;
	const descriptionId = `${onboarding.id}-description`;
	const avatarSrc = onboarding.avatarSrc ?? "/avatar-agent/teamwork-agents/blocker-checker.svg";
	const coverSrc = onboarding.coverSrc ?? avatarSrc;
	const closeLabel = onboarding.closeLabel ?? "Dismiss onboarding";
	const panelTransition = shouldReduceMotion
		? { duration: 0 }
		: { type: "spring" as const, bounce: 0, visualDuration: 0.34 };
	const fadeTransition = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.16, ease: [0, 0.4, 0, 1] as const };
	const statusLabel = onboarding.statusLabel
		?? (onboarding.status === "creating" ? "Creating..." : onboarding.status === "created" ? "Created" : "");

	const handleClose = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);
	const handleSecondaryAction = useCallback(() => {
		onboarding.onSecondaryAction?.();
		onOpenChange(false);
	}, [onboarding, onOpenChange]);

	return (
		<motion.section
			key={`floating-rovo-button-onboarding-${onboarding.id}`}
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			className={cn(
				"fixed z-[510] flex w-[295px] max-w-[calc(100vw-32px)] origin-bottom-right flex-col overflow-hidden rounded-lg bg-bg-neutral-bold text-text-inverse",
				placement ? null : "right-4 bottom-4 sm:right-6 sm:bottom-6",
			)}
			data-testid="floating-rovo-button-onboarding"
			exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
			initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			layoutId="floating-rovo-button-surface"
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.stopPropagation();
					handleClose();
				}
			}}
			role="dialog"
			style={{
				...(placement
					? {
							right: resolvedPlacement.right,
							bottom: resolvedPlacement.bottom,
						}
					: {}),
				boxShadow: token("elevation.shadow.overlay"),
				willChange: "transform, opacity",
			}}
			tabIndex={-1}
			transition={panelTransition}
		>
			<header className="flex h-12 shrink-0 items-center justify-between gap-3 px-4 py-3">
				<h2 id={titleId} className="min-w-0 truncate text-text-inverse" style={{ font: token("font.heading.xsmall") }}>
					{onboarding.title}
				</h2>
				<button
					aria-label={closeLabel}
					autoFocus
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
					onClick={handleClose}
					type="button"
				>
					<CrossIcon color={token("color.icon.inverse")} label="" size="small" />
				</button>
			</header>
			<motion.div
				className="flex flex-col"
				initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={fadeTransition}
			>
				<div className="relative overflow-hidden bg-surface text-text">
					<div
						aria-hidden="true"
						className="relative h-12 overflow-hidden"
						style={{
							backgroundColor: onboarding.coverBackgroundColor ?? token("color.icon.accent.blue"),
						}}
					>
						<Image
							alt=""
							aria-hidden
							className="absolute top-1/2 left-[72%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
							height={192}
							src={coverSrc}
							width={168}
						/>
					</div>
					<div className="flex flex-col gap-2 bg-surface-raised pt-8">
						<div className="flex flex-col gap-1 px-4 pt-2">
							<h3 className="truncate text-text" style={{ font: token("font.heading.medium") }}>
								{onboarding.agentName}
							</h3>
							<p className="text-xs leading-4 text-text-subtle">{onboarding.byline}</p>
						</div>
						<p id={descriptionId} className="px-4 pb-4 text-sm leading-5 text-text">
							{onboarding.description}
						</p>
					</div>
					<div className="absolute top-6 left-4 size-12">
						<Image
							alt={onboarding.avatarAlt ?? ""}
							className="h-12 w-[42px]"
							height={48}
							src={avatarSrc}
							width={42}
						/>
					</div>
				</div>
				<p className="px-4 pt-3 pb-2 text-sm leading-5 text-text-inverse">
					{onboarding.prompt}
				</p>
				<footer className="flex items-center justify-between gap-3 px-4 pt-2 pb-4">
					<p
						aria-live="polite"
						className={cn(
							"min-w-0 text-xs leading-4 text-text-inverse",
							statusLabel ? "opacity-80" : "opacity-0",
						)}
					>
						{statusLabel || "Idle"}
					</p>
					<div className="flex shrink-0 items-center justify-end gap-2">
						<button
							className="flex h-6 items-center justify-center rounded px-2 text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
							onClick={handleSecondaryAction}
							type="button"
						>
							{onboarding.secondaryActionLabel}
						</button>
						<button
							className="flex h-6 items-center justify-center rounded border border-border-inverse/40 bg-bg-neutral-bold px-2 text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-bg-neutral-bold-hovered focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-bg-neutral-bold-pressed disabled:cursor-default disabled:opacity-60"
							disabled={onboarding.primaryActionDisabled}
							onClick={onboarding.onPrimaryAction}
							type="button"
						>
							{onboarding.primaryActionLabel}
						</button>
					</div>
				</footer>
			</motion.div>
		</motion.section>
	);
}

export default function FloatingRovoButton({
	product,
	embedded = false,
	forceVisible = false,
	ariaLabel = "Open Rovo",
	placement,
	onButtonClick,
	suggestion,
	onboarding,
}: Readonly<FloatingRovoButtonProps>) {
	const { isOpen, openChat } = useRovoChat();
	const shouldReduceMotion = Boolean(useReducedMotion());
	const generatedLayoutGroupId = useId();
	const [internalOnboardingOpen, setInternalOnboardingOpen] = useState(onboarding?.defaultOpen ?? false);
	const shouldShowButton = forceVisible || !isOpen;
	const onboardingDefaultOpen = onboarding?.defaultOpen ?? false;
	const onboardingId = onboarding?.id;
	const onboardingOpen = Boolean(onboarding && (onboarding.open ?? internalOnboardingOpen));

	useEffect(() => {
		if (onboardingId) {
			setInternalOnboardingOpen(onboardingDefaultOpen);
		}
	}, [onboardingDefaultOpen, onboardingId]);

	const setOnboardingOpen = useCallback((open: boolean) => {
		if (onboarding?.open === undefined) {
			setInternalOnboardingOpen(open);
		}
		onboarding?.onOpenChange?.(open);
	}, [onboarding]);

	if (!forceVisible && (embedded || product === "rovo")) {
		return null;
	}

	const handleButtonClick = () => {
		if (onButtonClick) {
			onButtonClick();
			return;
		}

		if (onboarding && (onboarding.openOnButtonClick ?? true)) {
			setOnboardingOpen(true);
			return;
		}

		openChat("floating");
	};

	return (
		<>
			<style
				dangerouslySetInnerHTML={{
					__html: `
          .floating-rovo-button {
            position: fixed;
            bottom: var(--floating-rovo-button-bottom, 24px);
            right: var(--floating-rovo-button-right, 24px);
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

			<LayoutGroup id={`floating-rovo-button-${onboarding?.id ?? generatedLayoutGroupId}`}>
				<AnimatePresence>
					{suggestion && shouldShowButton && !onboardingOpen ? (
						<FloatingRovoButtonNudge key={suggestion.id} placement={placement} suggestion={suggestion} />
					) : null}
				</AnimatePresence>
				<AnimatePresence mode="popLayout">
					{onboarding && onboardingOpen ? (
						<FloatingRovoButtonOnboardingPanel
							key={`floating-rovo-button-onboarding-${onboarding.id}`}
							onboarding={onboarding}
							onOpenChange={setOnboardingOpen}
							placement={placement}
							shouldReduceMotion={shouldReduceMotion}
						/>
					) : shouldShowButton ? (
						<motion.button
							key="floating-rovo-button-control"
							aria-label={ariaLabel}
							className="floating-rovo-button"
							exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
							initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 8 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							layoutId="floating-rovo-button-surface"
							onClick={handleButtonClick}
							style={getFloatingRovoButtonPlacementStyle(placement)}
							transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0, 0.4, 0, 1] }}
							type="button"
							whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
							whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
						>
							<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
						</motion.button>
					) : null}
				</AnimatePresence>
			</LayoutGroup>
		</>
	);
}
