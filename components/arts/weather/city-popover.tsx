"use client";

import {
	AnimatePresence,
	motion,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import {
	CheckIcon,
	PinFilledIcon,
	PinIcon,
	PlusIcon,
	SearchIcon,
} from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

import type { LockscreenLocation } from "./locations";
import { PRESET_CITIES } from "./preset-cities";
import { GlassSlider } from "./glass-slider";

interface CityRailEditorProps {
	cities: ReadonlyArray<LockscreenLocation>;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	addCity: (city: LockscreenLocation) => void;
	openRequestKey?: number;
	onOpenChange?: (isOpen: boolean) => void;
	keyboardNavigationPulseKey?: number;
	/**
	 * Optional remove handler. Accepted for forward-compatibility with
	 * `useCities().removeCity` so the parent (`weather/index.tsx`) can
	 * forward it without a type mismatch. The popover doesn't render a
	 * delete affordance yet — wire one in here when designed.
	 */
	removeCity?: (cityId: string) => void;
	className?: string;
	height?: number;
	width?: number;
	/**
	 * Override the LiquidGlass props applied to the PROGRESS FILL of the
	 * inner GlassSlider(s). Forwarded verbatim — see GlassSlider for the
	 * full set of accepted keys (distortionScale, dispersion, blur,
	 * backgroundOpacity, etc.). Used by the `glass-slider` demo to render
	 * the weather slider in isolation with optional fill overrides.
	 */
	fillGlassProps?: Partial<LiquidGlassProps>;
	/**
	 * Override the CSS gradient layered on top of the inner GlassSlider's
	 * progress fill (a Rovo brand-color tint by default). Forwarded
	 * verbatim. Pass `undefined` (the default) to keep the slider's
	 * built-in default tint.
	 */
	fillTintGradient?: string;
	/** Forwarded to the inner GlassSlider's `fillTintBlendMode`. */
	fillTintBlendMode?: NonNullable<CSSProperties["mixBlendMode"]>;
	/** Forwarded to the inner GlassSlider's `fillMeniscusHeightPx`. */
	fillMeniscusHeightPx?: number;
	/** Forwarded to the inner GlassSlider's `fillMeniscusCurve`. */
	fillMeniscusCurve?: number;
	/** Forwarded to the inner GlassSlider's `fillMeniscusHeightPxActive`. */
	fillMeniscusHeightPxActive?: number;
	/** Forwarded to the inner GlassSlider's `fillMeniscusCurveActive`. */
	fillMeniscusCurveActive?: number;
}

const TRACK_INSET = 24;
const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 380;

const INLINE_MANAGER_GLASS_PROPS: Partial<LiquidGlassProps> = {
	borderRadius: 9999,
	borderWidth: 0.05,
	brightness: 50,
	opacity: 0.93,
	blur: 8,
	backgroundOpacity: 0.2,
	saturation: 1,
	distortionScale: -90,
	dispersion: 6,
	// Use the ADS default border token so the popover hairline tracks
	// the design-system border color across light/dark themes instead of
	// being a hard-coded translucent black.
	borderColor: "var(--ds-border)",
	borderOpacity: 1,
};

// Top + bottom edge fades for the scrollable city list. Implemented as a
// CSS mask-image on the scroll container itself so the fade follows the
// container's shape (including the outer squircle clip) and never
// produces a stray rectangle that pokes past the curved corners.
//
// Previous approach (an absolutely-positioned overlay div tinted with a
// linear-gradient) relied on the outer motion.div's `overflow-hidden`
// to clip the rectangle — but `overflow:hidden` clips against the
// standard `border-radius`, not the `corner-shape: superellipse` we use
// for the squircle, so a thin rectangular sliver was visible at the
// bottom corners. Masking the content directly side-steps the problem
// entirely: there is no rectangle to clip in the first place.
//
// The top fade mirrors the bottom one so list rows softly dissolve
// under the floating search bar as the user scrolls. We ramp the top
// fade height from 0 → SCROLL_FADE_PX based on the actual scrollTop so
// at rest (scrollTop === 0) the first row is fully opaque and there's
// no decorative haze — the fade only appears once the user has actually
// pushed content under the search bar.
const SCROLL_FADE_PX = 48;
const buildScrollFadeMask = (topFadePx: number) => {
	const top = Math.max(0, Math.min(SCROLL_FADE_PX, topFadePx));
	return `linear-gradient(to bottom, transparent 0%, #000 ${top}px, #000 calc(100% - ${SCROLL_FADE_PX}px), transparent 100%)`;
};

export function CityRailEditor({
	cities,
	selectedIndex,
	setSelectedIndex,
	addCity,
	openRequestKey = 0,
	onOpenChange,
	keyboardNavigationPulseKey = 0,
	className,
	height = DEFAULT_HEIGHT,
	width = DEFAULT_WIDTH,
	fillGlassProps,
	fillTintGradient,
	fillTintBlendMode,
	fillMeniscusHeightPx,
	fillMeniscusCurve,
	fillMeniscusHeightPxActive,
	fillMeniscusCurveActive,
}: Readonly<CityRailEditorProps>) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPinned, setIsPinned] = useState(false);
	const [hasManuallySelectedCity, setHasManuallySelectedCity] = useState(false);
	const [search, setSearch] = useState("");

	// Hover-driven preview: just update the previewed index. Does NOT pin
	// the city — the user has only moved the cursor across the slider, not
	// committed to a selection.
	const handleManualSelect = useCallback(
		(value: number) => {
			setSelectedIndex(value);
		},
		[setSelectedIndex],
	);

	// Explicit commit (click on the slider / a tick, drag-end, or keyboard
	// navigation). Only THIS path implies the user "chose" the city, so
	// only THIS path auto-pins and reveals the pin affordance.
	const handleCommit = useCallback(
		(value: number) => {
			setHasManuallySelectedCity(true);
			setIsPinned(true);
			setSelectedIndex(value);
		},
		[setSelectedIndex],
	);

	// Track the slider's deformed edge offsets (rubber-band overshoot,
	// hover-magnet, and active scale-up) so the floating + / pin buttons
	// stay glued to the actual top/bottom edges across every interaction
	// state instead of sitting at fixed offsets.
	//   • plusButtonY  ≤ 0 — drives the + button UP   with the top edge
	//   • pinButtonY   ≥ 0 — drives the pin button DOWN with the bottom edge
	const plusButtonY = useMotionValue(0);
	const pinButtonY = useMotionValue(0);
	const handleSliderShapeChange = useCallback(
		(offsets: { topOffsetPx: number; bottomOffsetPx: number }) => {
			plusButtonY.set(offsets.topOffsetPx);
			pinButtonY.set(offsets.bottomOffsetPx);
		},
		[plusButtonY, pinButtonY],
	);
	const shouldReduceMotion = useReducedMotion();
	const rootRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	// scrollTop in px, clamped 0..SCROLL_FADE_PX, drives the height of
	// the top mask fade so it ramps in only as the user scrolls down.
	const [topFadePx, setTopFadePx] = useState(0);
	const handleListScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			setTopFadePx(event.currentTarget.scrollTop);
		},
		[],
	);
	const scrollFadeMask = useMemo(() => buildScrollFadeMask(topFadePx), [topFadePx]);

	const railWidth = width - TRACK_INSET;
	const squircleShellStyle = useMemo(
		() =>
			({
				borderRadius: 9999,
				cornerShape: formatCornerShapeSuperellipse(SQUIRCLE_DEFAULT_SMOOTHNESS),
			}) as CSSProperties & { cornerShape: string },
		[],
	);

	useEffect(() => {
		onOpenChange?.(isOpen);
	}, [isOpen, onOpenChange]);

	useEffect(() => {
		if (openRequestKey <= 0) return;
		setIsOpen(true);
	}, [openRequestKey]);

	useEffect(() => {
		if (!isOpen) {
			setSearch("");
			return;
		}

		const focusHandle = window.requestAnimationFrame(() => {
			searchInputRef.current?.focus();
		});

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (!rootRef.current?.contains(target)) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		window.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.cancelAnimationFrame(focusHandle);
			window.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const filteredCities = useMemo(() => {
		if (!search.trim()) return PRESET_CITIES;
		const query = search.toLowerCase();
		return PRESET_CITIES.filter((city) => {
			return city.name.toLowerCase().includes(query)
				|| city.region.toLowerCase().includes(query);
		});
	}, [search]);

	const handleCityRowPress = useCallback(
		(city: LockscreenLocation, cityIndex: number) => {
			if (cityIndex !== -1) {
				handleCommit(cityIndex);
				setIsOpen(false);
				return;
			}

			addCity(city);
			const nextIndex = cities.length;
			handleCommit(nextIndex);
			setIsOpen(false);
		},
		[addCity, cities.length, handleCommit],
	);

	return (
		<div
			ref={rootRef}
			className={cn("group/city-rail relative overflow-visible", className)}
			style={{ width: railWidth, height }}
			onKeyDown={(event) => {
				if (isOpen || event.key !== "Enter") return;
				const target = event.target;
				if (!(target instanceof HTMLElement)) return;
				if (!target.closest('[role="slider"]')) return;
				event.preventDefault();
				setIsOpen(true);
			}}
		>
			{!isOpen ? (
				<div className="absolute inset-y-0 left-0 z-30" style={{ width: railWidth }}>
					<GlassSlider
						min={0}
						max={Math.max(0, cities.length - 1)}
						step={1}
						value={selectedIndex}
						onValueChange={handleManualSelect}
						onCommit={handleCommit}
						formatValue={(value) => cities[value]?.code ?? ""}
						tickLabels={cities.map((city) => city.code)}
						pinned={isPinned}
						aria-label="Cities"
						className="h-full w-full"
						trackShape="squircle"
						trackClassName="border-transparent bg-transparent"
						shell="liquid-glass"
						shellProps={{ dropShadow: false }}
						fillGlassProps={fillGlassProps}
						fillTintGradient={fillTintGradient}
						fillTintBlendMode={fillTintBlendMode}
						fillMeniscusHeightPx={fillMeniscusHeightPx}
						fillMeniscusCurve={fillMeniscusCurve}
						fillMeniscusHeightPxActive={fillMeniscusHeightPxActive}
						fillMeniscusCurveActive={fillMeniscusCurveActive}
						onShapeChange={handleSliderShapeChange}
						keyboardNavigationPulseKey={keyboardNavigationPulseKey}
					/>
				</div>
			) : null}

			<AnimatePresence initial={false}>
				{isOpen ? (
					<motion.div
						className="absolute inset-0 z-30 overflow-hidden"
						initial={{
							opacity: shouldReduceMotion ? 1 : 0,
							scale: shouldReduceMotion ? 1 : 0.98,
						}}
						animate={{ opacity: 1, scale: 1 }}
						exit={{
							opacity: shouldReduceMotion ? 1 : 0,
							scale: shouldReduceMotion ? 1 : 0.98,
						}}
						transition={
							shouldReduceMotion
								? { duration: 0 }
								: { duration: 0.2, ease: "easeOut" }
						}
						style={squircleShellStyle as CSSProperties}
					>
						<LiquidGlass
							width="100%"
							height="100%"
							{...INLINE_MANAGER_GLASS_PROPS}
							style={{
								position: "absolute",
								inset: 0,
								...squircleShellStyle,
							} as CSSProperties}
						/>
						<div className="relative z-10 flex h-full flex-col px-3 py-3">
							<div className="mb-3 flex items-center gap-2 px-3 py-2 text-text-subtle">
								<SearchIcon className="size-3.5 shrink-0 opacity-40" />
								<input
									ref={searchInputRef}
									type="text"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search cities..."
									className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtlest"
								/>
							</div>

							<div className="relative min-h-0 flex-1">
								<div
									className="absolute inset-0 overflow-y-auto pr-1"
									onScroll={handleListScroll}
									style={{
										WebkitMaskImage: scrollFadeMask,
										maskImage: scrollFadeMask,
									}}
								>
									<div
										className={cn(
											"flex flex-col gap-1 pb-10",
											filteredCities.length === 0 && "h-full",
										)}
									>
										{filteredCities.length > 0 ? (
											filteredCities.map((city) => {
												const cityIndex = cities.findIndex((item) => item.id === city.id);
												const isSelected = cityIndex === selectedIndex;

												return (
													<div
														key={city.id}
														className="flex items-center gap-2 px-3 py-2"
													>
														<button
															type="button"
															onClick={() => handleCityRowPress(city, cityIndex)}
															className="min-w-0 flex-1 text-left"
														>
															<div className="flex items-center gap-2">
																<span
																	className="truncate text-sm font-medium text-text"
																	style={{ fontFamily: "'DotGothic16', sans-serif" }}
																>
																	{city.name}
																</span>
															</div>
															<p
																className="truncate uppercase tracking-[0.3em] text-text-subtle"
																style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}
															>
																{city.region}
															</p>
														</button>

														{isSelected ? (
															<span
																className="flex h-8 w-8 shrink-0 items-center justify-center text-icon"
																aria-hidden="true"
															>
																<CheckIcon className="size-3.5" />
															</span>
														) : (
															null
														)}
													</div>
												);
											})
										) : (
											<Empty width="narrow" className="px-4 py-6">
												<EmptyHeader>
													<EmptyMedia>
														<Image
															src="/illustration-spot/error-state/search-no-result/light.svg"
															alt=""
															role="presentation"
															width={120}
															height={120}
														/>
													</EmptyMedia>
													<EmptyTitle
														headingSize="xsmall"
														className="flex flex-col items-center text-[15px] font-medium uppercase leading-tight tracking-[0.36em] text-text-subtlest"
														style={{
															letterSpacing: "0.36em",
															fontFamily: "'Bitcount Grid Single', sans-serif",
														}}
													>
														<span>No</span>
														<span>Cities</span>
														<span>Found</span>
													</EmptyTitle>
												</EmptyHeader>
											</Empty>
										)}
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>

			{/* Outer wrapper handles fixed positioning (anchored 8px above
			    the slider's top edge). Inner motion.div applies the
			    rubber-band offset so the + button follows the stretched
			    top edge of the slider. */}
				{!isOpen ? (
					<div
						className="absolute left-1/2 top-0 z-40 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/city-rail:opacity-100 group-focus-within/city-rail:opacity-100"
						style={{ transform: "translate(-50%, calc(-100% - 8px))" }}
					>
						<motion.div style={{ y: plusButtonY }}>
							<button
								type="button"
								onClick={() => setIsOpen(true)}
								className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-icon transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed"
								aria-label="Add city"
							>
								<PlusIcon className="size-3.5" />
							</button>
						</motion.div>
					</div>
				) : null}

			{/* Outer wrapper handles fixed positioning (anchored 8px below
			    the slider's bottom edge). Inner motion.div applies the
			    rubber-band offset so the pin button follows the stretched
			    bottom edge of the slider. */}
				{!isOpen && (hasManuallySelectedCity || isPinned) ? (
					<div
						className="absolute bottom-0 left-1/2 z-40 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/city-rail:opacity-100 group-focus-within/city-rail:opacity-100"
						style={{ transform: "translate(-50%, calc(100% + 8px))" }}
					>
						<motion.div style={{ y: pinButtonY }}>
							<button
								type="button"
								onClick={() => setIsPinned((current) => !current)}
								className={cn(
									"flex h-7 w-7 items-center justify-center rounded-full border border-transparent transition-colors",
									// In the selected (pinned) state we drop the
									// circular backdrop entirely — only the icon
									// remains. Unpinned still gets the soft hover
									// chip so the affordance is discoverable.
									isPinned
										? "text-icon"
										: "text-icon-subtle hover:bg-bg-neutral-subtle-hovered hover:text-icon active:bg-bg-neutral-subtle-pressed",
								)}
								aria-pressed={isPinned}
								aria-label={isPinned ? "Unpin city" : "Pin city"}
							>
								{isPinned ? (
									<PinFilledIcon className="size-3.5" />
								) : (
									<PinIcon className="size-3.5" />
								)}
							</button>
						</motion.div>
					</div>
				) : null}
		</div>
	);
}
