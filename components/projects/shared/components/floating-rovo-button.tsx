"use client";

import { type CSSProperties, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CrossIcon from "@atlaskit/icon/core/cross";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
				backfaceVisibility: "hidden",
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

function FloatingRovoButtonOnboardingPanelInner({
	onboarding,
	onOpenChange,
	shouldReduceMotion,
}: Readonly<{
	onboarding: FloatingRovoButtonOnboardingConfig;
	onOpenChange: (open: boolean) => void;
	shouldReduceMotion: boolean;
}>) {
	const titleId = `${onboarding.id}-title`;
	const descriptionId = `${onboarding.id}-description`;
	const avatarSrc = onboarding.avatarSrc ?? "/avatar-agent/teamwork-agents/blocker-checker.svg";
	const coverSrc = onboarding.coverSrc ?? avatarSrc;
	const closeLabel = onboarding.closeLabel ?? "Dismiss onboarding";
	const phaseOneTransition = shouldReduceMotion
		? { duration: 0 }
		: { type: "spring" as const, bounce: 0.18, visualDuration: 0.26, delay: 0.22 };
	const phaseTwoContainer = shouldReduceMotion
		? { duration: 0 }
		: { delayChildren: 0.36, staggerChildren: 0.05 };
	const phaseTwoChild = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.22, ease: [0, 0.4, 0, 1] as const };
	const phaseTwoHeaderTransition = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.22, delay: 0.32, ease: [0, 0.4, 0, 1] as const };
	const phaseTwoVariants = shouldReduceMotion
		? ({
			hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
			visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: phaseTwoChild },
		} as const)
		: ({
			hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
			visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: phaseTwoChild },
		} as const);
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
			key="floating-rovo-button-panel"
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			className="flex w-full flex-col text-text-inverse"
			data-testid="floating-rovo-button-onboarding"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0 } }}
			transition={shouldReduceMotion
				? { duration: 0 }
				: { duration: 0.14, delay: 0.18, ease: [0, 0.4, 0, 1] as const }}
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.stopPropagation();
					handleClose();
				}
			}}
			role="dialog"
			tabIndex={-1}
		>
			<motion.header
				className="flex h-12 shrink-0 items-center justify-between gap-3 py-3 pr-2 pl-4"
				variants={phaseTwoVariants}
				initial="hidden"
				animate="visible"
				transition={phaseTwoHeaderTransition}
				style={{ willChange: "transform, opacity, filter" }}
			>
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
			</motion.header>
			<div className="flex flex-col">
				<div className="relative overflow-hidden bg-surface text-text">
					<motion.div
						aria-hidden="true"
						className="relative h-12 overflow-hidden"
						initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={phaseOneTransition}
						style={{
							backgroundColor: onboarding.coverBackgroundColor ?? token("color.icon.accent.blue"),
							willChange: "transform, opacity",
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
					</motion.div>
					<motion.div
						className="flex flex-col gap-2 bg-surface-raised pt-8"
						initial="hidden"
						animate="visible"
						variants={{
							hidden: {},
							visible: { transition: phaseTwoContainer },
						}}
					>
						<motion.div
							className="flex flex-col gap-1 px-4 pt-2"
							variants={phaseTwoVariants}
							style={{ willChange: "transform, opacity, filter" }}
						>
							<h3 className="truncate text-text" style={{ font: token("font.heading.medium") }}>
								{onboarding.agentName}
							</h3>
							<p className="text-xs leading-4 text-text-subtle">{onboarding.byline}</p>
						</motion.div>
						<motion.p
							id={descriptionId}
							className="px-4 pb-4 text-sm leading-5 text-text"
							variants={phaseTwoVariants}
							style={{ willChange: "transform, opacity, filter" }}
						>
							{onboarding.description}
						</motion.p>
					</motion.div>
					<motion.div
						className="absolute top-6 left-4 size-12"
						initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={phaseOneTransition}
						style={{ willChange: "transform, opacity" }}
					>
						<Image
							alt={onboarding.avatarAlt ?? ""}
							className="h-12 w-[42px]"
							height={48}
							src={avatarSrc}
							width={42}
						/>
					</motion.div>
				</div>
				<motion.div
					className="flex flex-col"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: { transition: { ...phaseTwoContainer, delayChildren: 0.46 } },
					}}
				>
					<motion.p
						className="px-4 pt-3 pb-2 text-sm leading-5 text-text-inverse"
						variants={phaseTwoVariants}
						style={{ willChange: "transform, opacity, filter" }}
					>
						{onboarding.prompt}
					</motion.p>
					<motion.footer
						className="flex items-center justify-between gap-3 px-4 pt-2 pb-4"
						variants={phaseTwoVariants}
						style={{ willChange: "transform, opacity, filter" }}
					>
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
					</motion.footer>
				</motion.div>
			</div>
		</motion.section>
	);
}

function FloatingRovoButtonInner({
	onClick,
	ariaLabel,
	shouldReduceMotion,
}: Readonly<{
	onClick: () => void;
	ariaLabel: string;
	shouldReduceMotion: boolean;
}>) {
	return (
		<motion.button
			key="floating-rovo-button-icon"
			aria-label={ariaLabel}
			className="flex h-full w-full items-center justify-center"
			onClick={onClick}
			type="button"
			initial={shouldReduceMotion
				? { opacity: 0 }
				: { opacity: 0, filter: "blur(6px)" }}
			animate={shouldReduceMotion
				? { opacity: 1 }
				: { opacity: 1, filter: "blur(0px)" }}
			exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.08 } }}
			transition={shouldReduceMotion
				? { duration: 0 }
				: { duration: 0.2, delay: 0.24, ease: [0, 0.4, 0, 1] as const }}
			style={{ willChange: "opacity, filter" }}
		>
			<Image src="/1p/rovo.svg" alt="" width={24} height={24} aria-hidden />
		</motion.button>
	);
}

function FloatingRovoButtonSurface({
	onboardingOpen,
	onboarding,
	onOpenChange,
	placement,
	ariaLabel,
	onButtonClick,
	shouldReduceMotion,
}: Readonly<{
	onboardingOpen: boolean;
	onboarding: FloatingRovoButtonOnboardingConfig | null | undefined;
	onOpenChange: (open: boolean) => void;
	placement?: FloatingRovoButtonPlacement;
	ariaLabel: string;
	onButtonClick: () => void;
	shouldReduceMotion: boolean;
}>) {
	const resolvedPlacement = resolveFloatingRovoButtonPlacement(placement);
	const surfaceTransition = shouldReduceMotion
		? { duration: 0 }
		: { type: "spring" as const, bounce: 0, visualDuration: 0.28 };
	const radiusTransition = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.28, ease: "linear" as const };
	const surfaceStyle: CSSProperties = {
		right: resolvedPlacement.right,
		bottom: resolvedPlacement.bottom,
		boxShadow: token("elevation.shadow.overlay"),
		transformOrigin: "center",
		willChange: "transform, opacity",
		backfaceVisibility: "hidden",
	};
	const hoverScale = !onboardingOpen && !shouldReduceMotion ? { scale: 1.1 } : undefined;
	const tapScale = !onboardingOpen && !shouldReduceMotion ? { scale: 0.98 } : undefined;

	return (
		<motion.div
			key="floating-rovo-button-surface"
			layout
			className={cn(
				"fixed z-[510] overflow-hidden bg-bg-neutral-bold",
				onboardingOpen
					? "w-[295px] max-w-[calc(100vw-32px)]"
					: "size-12",
			)}
			initial={{ opacity: 0, borderRadius: onboardingOpen ? 8 : 16 }}
			animate={{
				opacity: 1,
				borderRadius: onboardingOpen ? 8 : 16,
			}}
			exit={{ opacity: 0 }}
			transition={{
				default: surfaceTransition,
				borderRadius: radiusTransition,
			}}
			style={surfaceStyle}
			whileHover={hoverScale}
			whileTap={tapScale}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				{onboardingOpen && onboarding ? (
					<FloatingRovoButtonOnboardingPanelInner
						key="panel"
						onboarding={onboarding}
						onOpenChange={onOpenChange}
						shouldReduceMotion={shouldReduceMotion}
					/>
				) : (
					<FloatingRovoButtonInner
						key="button"
						onClick={onButtonClick}
						ariaLabel={ariaLabel}
						shouldReduceMotion={shouldReduceMotion}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

export default function FloatingRovoButton({
	product,
	embedded = false,
	forceVisible = false,
	ariaLabel,
	placement,
	onButtonClick,
	suggestion,
	onboarding,
}: Readonly<FloatingRovoButtonProps>) {
	const { isOpen, openChat } = useRovoChat();
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [internalOnboardingOpen, setInternalOnboardingOpen] = useState(onboarding?.defaultOpen ?? false);
	const shouldShowButton = forceVisible || !isOpen;
	const onboardingDefaultOpen = onboarding?.defaultOpen ?? false;
	const onboardingId = onboarding?.id;
	const onboardingOpen = Boolean(onboarding && (onboarding.open ?? internalOnboardingOpen));
	const shouldOpenOnboardingFromButton = Boolean(onboarding && (onboarding.openOnButtonClick ?? true));
	const resolvedAriaLabel = ariaLabel ?? (shouldOpenOnboardingFromButton ? "Open onboarding" : "Open Rovo");
	const shouldRenderSurface = (shouldShowButton || onboardingOpen) && !(embedded || product === "rovo");

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

		if (shouldOpenOnboardingFromButton) {
			setOnboardingOpen(true);
			return;
		}

		openChat("floating");
	};

	return (
		<>
			<AnimatePresence>
				{suggestion && shouldShowButton && !onboardingOpen ? (
					<FloatingRovoButtonNudge key={suggestion.id} placement={placement} suggestion={suggestion} />
				) : null}
			</AnimatePresence>
			<AnimatePresence>
				{shouldRenderSurface ? (
					<FloatingRovoButtonSurface
						key="surface"
						onboardingOpen={onboardingOpen}
						onboarding={onboarding}
						onOpenChange={setOnboardingOpen}
						placement={placement}
						ariaLabel={resolvedAriaLabel}
						onButtonClick={handleButtonClick}
						shouldReduceMotion={shouldReduceMotion}
					/>
				) : null}
			</AnimatePresence>
		</>
	);
}
