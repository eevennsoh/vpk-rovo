"use client";

import {
	AnimatePresence,
	motion,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
import Image from "next/image";
import {
	useCallback,
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	useState,
} from "react";
import type { CSSProperties } from "react";

import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

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
import { useCitySearch } from "./use-city-search";

// Pool of preloaded <audio> elements keyed by src. Reusing the same element
// across calls means:
//  1. The first successful playback after a user gesture "unlocks" that
//     element for the rest of the session, so subsequent hover-triggered
//     plays keep working without re-failing the browser autoplay check.
//  2. Rapid re-triggers (hover scrub across ticks) reset to time 0 and
//     replay instead of being swallowed mid-playback.
const audioPool = new Map<string, HTMLAudioElement>();

function getPooledAudio(src: string): HTMLAudioElement {
	let audio = audioPool.get(src);
	if (!audio) {
		audio = new Audio(src);
		audio.preload = "auto";
		audioPool.set(src, audio);
	}
	return audio;
}

// Browser autoplay policies block `<audio>.play()` until the page has
// received a "user activation" gesture (click/keydown/pointerdown/
// touchstart). Hover events do NOT count, so the very first hover-only
// interaction with the slider can't play. We install a one-shot
// capture-phase listener that primes every pooled <audio> with a silent
// play+pause on first gesture, after which non-gesture .play() calls
// work for the rest of the session.
let audioUnlocked = false;
function unlockAllAudio() {
	if (audioUnlocked) return;
	audioUnlocked = true;
	for (const audio of audioPool.values()) {
		const previousVolume = audio.volume;
		audio.volume = 0;
		audio
			.play()
			.then(() => {
				audio.pause();
				audio.currentTime = 0;
				audio.volume = previousVolume;
			})
			.catch(() => {
				audio.volume = previousVolume;
			});
	}
}

function ensureAudioUnlockListener() {
	if (typeof window === "undefined") return;
	if ((window as unknown as { __vpkAudioUnlockBound?: boolean }).__vpkAudioUnlockBound) {
		return;
	}
	(window as unknown as { __vpkAudioUnlockBound?: boolean }).__vpkAudioUnlockBound = true;
	const handler = () => {
		unlockAllAudio();
		window.removeEventListener("pointerdown", handler, true);
		window.removeEventListener("keydown", handler, true);
		window.removeEventListener("touchstart", handler, true);
	};
	window.addEventListener("pointerdown", handler, true);
	window.addEventListener("keydown", handler, true);
	window.addEventListener("touchstart", handler, true);
}

// Install at module-load time (client only) so the very first gesture
// anywhere in the page primes the pool — even if the user hovers the
// slider before any other playSound caller runs.
if (typeof window !== "undefined") {
	ensureAudioUnlockListener();
}

function playSound(src: string) {
	if (typeof window === "undefined") return;
	ensureAudioUnlockListener();
	const audio = getPooledAudio(src);
	audio.volume = 0.5;
	try {
		audio.currentTime = 0;
	} catch {
		// Some browsers throw if metadata isn't loaded yet — safe to skip.
	}
	audio.play().catch(() => {
		// Most failures here are NotAllowedError before the user has
		// produced a qualifying gesture. The module-load capture-phase
		// unlock listener primes the pool on first gesture; after that,
		// hover-only plays succeed for the rest of the session.
	});
}

interface CityRailEditorProps {
	cities: ReadonlyArray<LockscreenLocation>;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	addCity: (city: LockscreenLocation) => void;
	openRequestKey?: number;
	onOpenChange?: (isOpen: boolean) => void;
	keyboardNavigationPulseKey?: number;
	/**
	 * Optional remove handler used by keyboard toggles on already-selected
	 * cities. Keep forwarding it from `useCities().removeCity` so the
	 * popover can deselect rows without owning the list state.
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
	removeCity,
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
	const [highlightedIndex, setHighlightedIndex] = useState(0);

	// Hover-driven preview: just update the previewed index. Does NOT pin
	// the city — the user has only moved the cursor across the slider, not
	// committed to a selection.
	const handleManualSelect = useCallback(
		(value: number) => {
			playSound("/sound/click-002.mp3");
			setSelectedIndex(value);
		},
		[setSelectedIndex],
	);

	// When pinned, hover-to-select is disabled so handleManualSelect never
	// fires. Use onHoverTickChange to still play the sound as the cursor
	// moves across cities.
	const handleHoverTickChange = useCallback(
		(index: number | null) => {
			if (index !== null) {
				playSound("/sound/click-002.mp3");
			}
		},
		[],
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
	const handledOpenRequestKeyRef = useRef(0);
	// scrollTop in px, clamped 0..SCROLL_FADE_PX, drives the height of
	// the top mask fade so it ramps in only as the user scrolls down.
	const [topFadePx, setTopFadePx] = useState(0);
	// Idle timer for `data-scrolling` toggling so .scrollbar-auto-hide
	// reveals its thumb only while the user is actively scrolling and
	// hides it again ~600ms after motion stops.
	const scrollIdleTimerRef = useRef<number | null>(null);
	const handleListScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			setTopFadePx(event.currentTarget.scrollTop);
			const node = event.currentTarget;
			node.setAttribute("data-scrolling", "");
			if (scrollIdleTimerRef.current !== null) {
				window.clearTimeout(scrollIdleTimerRef.current);
			}
			scrollIdleTimerRef.current = window.setTimeout(() => {
				node.removeAttribute("data-scrolling");
				scrollIdleTimerRef.current = null;
			}, 600);
		},
		[],
	);
	useEffect(() => {
		return () => {
			if (scrollIdleTimerRef.current !== null) {
				window.clearTimeout(scrollIdleTimerRef.current);
			}
		};
	}, []);
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
		if (
			openRequestKey <= 0 ||
			openRequestKey === handledOpenRequestKeyRef.current
		) {
			return;
		}
		handledOpenRequestKeyRef.current = openRequestKey;
		playSound("/sound/click-001.mp3");
		setIsOpen(true);
		setHighlightedIndex(0);
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

		window.addEventListener("pointerdown", handlePointerDown);

		return () => {
			window.cancelAnimationFrame(focusHandle);
			window.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [isOpen]);

	// Live search against Open-Meteo's geocoding API. The hook debounces
	// input, aborts stale requests, caches responses, and short-circuits
	// for queries shorter than its minimum length — so we can hand the
	// raw `search` value through without any extra wiring.
	const {
		results: remoteCities,
		isLoading: isRemoteLoading,
		error: remoteError,
	} = useCitySearch(search);

	const filteredCities = useMemo(() => {
		if (!search.trim()) return PRESET_CITIES;
		const query = search.toLowerCase();
		const presetMatches = PRESET_CITIES.filter((city) => {
			return city.name.toLowerCase().includes(query)
				|| city.region.toLowerCase().includes(query);
		});

		// Merge presets first (they're instant + already curated) then
		// API results, deduping by id so a preset and an API hit for the
		// same place don't both render.
		const seen = new Set<string>(presetMatches.map((city) => city.id));
		const merged: LockscreenLocation[] = [...presetMatches];
		for (const city of remoteCities) {
			if (seen.has(city.id)) continue;
			seen.add(city.id);
			merged.push(city);
		}
		return merged;
	}, [search, remoteCities]);

	useEffect(() => {
		setHighlightedIndex(0);
	}, [filteredCities]);

	// Keep row clicks aligned with keyboard Enter: toggle the city in place
	// without dismissing the manager.
	const toggleCitySelection = useCallback(
		(city: LockscreenLocation, cityIndex: number) => {
			const isRemoving = cityIndex !== -1 && Boolean(removeCity);
			playSound(isRemoving ? "/sound/click-004.mp3" : "/sound/click-001.mp3");
			if (cityIndex !== -1 && removeCity) {
				removeCity(city.id);
			} else {
				addCity(city);
				handleCommit(cities.length);
			}
		},
		[addCity, cities.length, handleCommit, removeCity],
	);

	const handleCityRowPress = useCallback(
		(city: LockscreenLocation, cityIndex: number) => {
			toggleCitySelection(city, cityIndex);
		},
		[toggleCitySelection],
	);

	const handleOpenKeyDown = useEffectEvent((event: KeyboardEvent) => {
		if (event.key === "Escape") {
			playSound("/sound/click-004.mp3");
			setIsOpen(false);
			return;
		}
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setHighlightedIndex((prev) => {
				const next = Math.min(prev + 1, Math.max(filteredCities.length - 1, 0));
				if (next !== prev) {
					playSound("/sound/click-002.mp3");
				}
				return next;
			});
			return;
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			setHighlightedIndex((prev) => {
				const next = Math.max(prev - 1, 0);
				if (next !== prev) {
					playSound("/sound/click-002.mp3");
				}
				return next;
			});
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			const city = filteredCities[highlightedIndex];
			if (!city) return;
			const cityIndex = cities.findIndex((item) => item.id === city.id);
			toggleCitySelection(city, cityIndex);
		}
	});

	useEffect(() => {
		if (!isOpen) return;

		window.addEventListener("keydown", handleOpenKeyDown);
		return () => window.removeEventListener("keydown", handleOpenKeyDown);
	}, [isOpen]);

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
				playSound("/sound/click-001.mp3");
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
						onHoverTickChange={handleHoverTickChange}
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
									className="w-full bg-transparent text-sm text-text-subtlest outline-none placeholder:text-text-subtlest"
								/>
							</div>

							<div className="relative min-h-0 flex-1">
								<div
									className="scrollbar-auto-hide absolute inset-0 overflow-y-auto pl-1 pr-0"
									onScroll={handleListScroll}
									style={{
										WebkitMaskImage: scrollFadeMask,
										maskImage: scrollFadeMask,
										// The shared `.scrollbar-auto-hide` utility uses
										// `scrollbar-gutter: stable both-edges` to keep
										// content centered when the thumb appears. In
										// this popover that reserved gutter reads as
										// extra right padding on the row highlight, so
										// let the thin thumb overlay the content
										// instead of shrinking the usable list width.
										scrollbarGutter: "unset",
									}}
								>
									<div
										className={cn(
											"flex flex-col gap-1 pb-10",
											filteredCities.length === 0 && "h-full",
										)}
									>
										{filteredCities.length > 0 ? (
											filteredCities.map((city, index) => {
												const cityIndex = cities.findIndex((item) => item.id === city.id);
												const isSelected = cityIndex !== -1;
												const isHighlighted = index === highlightedIndex;

												return (
													<button
														key={city.id}
														ref={isHighlighted ? (el) => el?.scrollIntoView({ block: "nearest" }) : undefined}
														type="button"
														onClick={() => handleCityRowPress(city, cityIndex)}
														onPointerEnter={() => setHighlightedIndex(index)}
														className={cn(
															"flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors duration-normal ease-out",
															"hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
															"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
															isHighlighted && "bg-bg-neutral-subtle-hovered",
														)}
													>
														<div className="min-w-0 flex-1">
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
														</div>

														{isSelected ? (
															<span
																className="flex h-8 w-8 shrink-0 items-center justify-center text-icon-subtlest"
																aria-hidden="true"
															>
																<CheckIcon className="size-3.5" />
															</span>
														) : (
															null
														)}
													</button>
												);
											})
										) : (
											<Empty width="narrow" className="px-4 py-6">
												<EmptyHeader>
													<EmptyMedia>
														{isRemoteLoading ? (
															<div
																className="flex size-[120px] items-center justify-center text-text-subtle"
																role="presentation"
															>
																<Spinner
																	size="xl"
																	label="Searching the world"
																/>
															</div>
														) : (
															<Image
																src="/illustration-spot/error-state/search-no-result/light.svg"
																alt=""
																role="presentation"
																width={120}
																height={120}
															/>
														)}
													</EmptyMedia>
													<EmptyTitle
														headingSize="xsmall"
														className="flex flex-col items-center text-[15px] font-medium uppercase leading-tight tracking-[0.36em] text-text-subtlest"
														style={{
															letterSpacing: "0.36em",
															fontFamily: "'Bitcount Grid Single', sans-serif",
														}}
													>
														{isRemoteLoading ? (
															<>
																<span>Searching</span>
																<span>The</span>
																<span>World</span>
															</>
														) : remoteError ? (
															<>
																<span>Search</span>
																<span>Unavailable</span>
															</>
														) : (
															<>
																<span>No</span>
																<span>Cities</span>
																<span>Found</span>
															</>
														)}
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
									onClick={() => { playSound("/sound/click-001.mp3"); setIsOpen(true); }}
									className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-transparent text-icon-subtlest transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
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
								onClick={() => { playSound("/sound/click-001.mp3"); setIsPinned((current) => !current); }}
									className={cn(
										"flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-transparent text-icon-subtlest transition-colors",
										// Always show the soft circular hover/press
										// chip — including in the pinned state — so
									// the click target stays discoverable when
										// users want to unpin. The pinned vs
										// unpinned distinction is conveyed by the
										// icon (PinFilledIcon vs PinIcon), not by
										// the backdrop.
										"hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
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
