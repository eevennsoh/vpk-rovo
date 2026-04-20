"use client";

import {
	AnimatePresence,
	motion,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import {
	MinusIcon,
	PinFilledIcon,
	PinIcon,
	PlusIcon,
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
	removeCity: (index: number) => void;
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
const EXPANDED_WIDTH = 356;

function SearchIcon() {
	return (
		<svg
			width={14}
			height={14}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			className="shrink-0 opacity-40"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
	);
}

export function CityRailEditor({
	cities,
	selectedIndex,
	setSelectedIndex,
	addCity,
	removeCity,
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

	const railWidth = width - TRACK_INSET;
	const selectedCity = cities[selectedIndex] ?? cities[0] ?? PRESET_CITIES[0];
	const squircleShellStyle = useMemo(
		() =>
			({
				borderRadius: 9999,
				cornerShape: formatCornerShapeSuperellipse(SQUIRCLE_DEFAULT_SMOOTHNESS),
			}) as CSSProperties & { cornerShape: string },
		[],
	);

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

	return (
		<div
			ref={rootRef}
			className={cn("group/city-rail relative overflow-visible", className)}
			style={{ width: railWidth, height }}
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
					/>
				</div>
			) : null}

			<AnimatePresence initial={false}>
				{isOpen ? (
					<>
						<motion.div
							className="absolute inset-y-0 left-0 z-30 overflow-hidden"
							initial={{
								width: shouldReduceMotion ? EXPANDED_WIDTH : railWidth,
							}}
							animate={{ width: EXPANDED_WIDTH }}
							exit={{
								width: shouldReduceMotion ? EXPANDED_WIDTH : railWidth,
							}}
							transition={
								shouldReduceMotion
									? { duration: 0 }
									: {
											type: "spring",
											stiffness: 240,
											damping: 28,
											mass: 0.9,
										}
							}
							style={squircleShellStyle as CSSProperties}
						>
							<LiquidGlass
								width="100%"
								height="100%"
								borderRadius={9999}
								borderWidth={0.05}
								brightness={50}
								opacity={0.93}
								blur={8}
								backgroundOpacity={0.2}
								saturation={1}
								distortionScale={-90}
								dispersion={6}
								borderOpacity={0.35}
								style={{
									position: "absolute",
									inset: 0,
									...squircleShellStyle,
								} as CSSProperties}
							/>
							<div className="relative z-10 flex h-full">
								<div
									className="relative z-10 h-full shrink-0"
									style={{ width: railWidth }}
								>
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
										fillGlassProps={fillGlassProps}
										fillTintGradient={fillTintGradient}
										fillTintBlendMode={fillTintBlendMode}
										fillMeniscusHeightPx={fillMeniscusHeightPx}
										fillMeniscusCurve={fillMeniscusCurve}
										fillMeniscusHeightPxActive={fillMeniscusHeightPxActive}
										fillMeniscusCurveActive={fillMeniscusCurveActive}
										onShapeChange={handleSliderShapeChange}
									/>
								</div>

								<motion.div
									className="min-w-0 flex-1"
									initial={{
										opacity: shouldReduceMotion ? 1 : 0,
										x: shouldReduceMotion ? 0 : 18,
									}}
									animate={{ opacity: 1, x: 0 }}
									exit={{
										opacity: shouldReduceMotion ? 1 : 0,
										x: shouldReduceMotion ? 0 : 18,
									}}
									transition={
										shouldReduceMotion
											? { duration: 0 }
											: { duration: 0.2, ease: "easeOut" }
									}
								>
									<div className="flex h-full flex-col border-l border-border/70 px-4 py-4">
										<div className="mb-3 flex items-center gap-3 rounded-full border border-border/70 bg-surface-overlay/85 px-3 py-2 text-text-subtle shadow-xs backdrop-blur">
											<SearchIcon />
											<input
												ref={searchInputRef}
												type="text"
												value={search}
												onChange={(event) => setSearch(event.target.value)}
												placeholder="Search cities..."
												className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtlest"
											/>
										</div>

										<div className="mb-3 flex items-center justify-between px-1">
											<div className="min-w-0">
												<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-text-subtlest">
													Manage cities
												</p>
												<p className="truncate text-xs text-text-subtle">
													{cities.length} saved, {selectedCity.name} selected
												</p>
											</div>
											<button
												type="button"
												onClick={() => setIsOpen(false)}
												className="flex h-7 w-7 items-center justify-center rounded-full text-icon-subtle transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-icon active:bg-bg-neutral-subtle-pressed"
												aria-label="Close city manager"
											>
												<svg
													width={14}
													height={14}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth={2}
													strokeLinecap="round"
													aria-hidden="true"
												>
													<line x1="6" y1="6" x2="18" y2="18" />
													<line x1="6" y1="18" x2="18" y2="6" />
												</svg>
											</button>
										</div>

										<div className="min-h-0 flex-1 overflow-y-auto pr-1">
											<div className="flex flex-col gap-2">
												{filteredCities.length > 0 ? (
													filteredCities.map((city) => {
														const cityIndex = cities.findIndex((item) => item.id === city.id);
														const isCityAdded = cityIndex !== -1;
														const isSelected = isCityAdded && cityIndex === selectedIndex;
														const disableRemove = isCityAdded && cities.length <= 1;

														return (
															<div
																key={city.id}
																className={cn(
																	"group flex items-center gap-2 rounded-[24px] border px-3 py-2 transition-colors",
																	isSelected
																		? "border-border bg-bg-neutral/60"
																		: "border-transparent bg-surface-overlay/60 hover:bg-bg-neutral/40",
																)}
															>
																<button
																	type="button"
																	onClick={() => {
																		if (isCityAdded) {
																			// Clicking an already-added city in
																			// the manage list is an explicit pick
																			// → commit (auto-pin).
																			handleCommit(cityIndex);
																			return;
																		}
																		addCity(city);
																	}}
																	className="min-w-0 flex-1 text-left"
																>
																	<div className="flex items-center gap-2">
																		<span className="truncate text-sm font-medium text-text">
																			{city.name}
																		</span>
																		{isSelected ? (
																			<span className="rounded-full bg-bg-neutral px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-text-subtle">
																				Live
																			</span>
																		) : null}
																	</div>
																	<p className="truncate text-[11px] text-text-subtle">
																		{city.region}
																	</p>
																</button>

																{isCityAdded ? (
																	<button
																		type="button"
																		disabled={disableRemove}
																		onClick={() => {
																			if (!disableRemove) {
																				removeCity(cityIndex);
																			}
																		}}
																		className={cn(
																			"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-icon-subtle transition-colors",
																			disableRemove
																				? "opacity-20"
																				: "hover:bg-bg-neutral-subtle-hovered hover:text-icon active:bg-bg-neutral-subtle-pressed",
																		)}
																		aria-label={`Remove ${city.name}`}
																	>
																		<MinusIcon className="size-3.5" />
																	</button>
																) : (
																	<button
																		type="button"
																		onClick={() => addCity(city)}
																		className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-icon-subtle transition-colors hover:bg-bg-neutral-subtle-hovered hover:text-icon active:bg-bg-neutral-subtle-pressed"
																		aria-label={`Add ${city.name}`}
																	>
																		<PlusIcon className="size-3.5" />
																	</button>
																)}
															</div>
														);
													})
												) : (
													<div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-border/70 bg-surface-overlay/60 px-4 py-8 text-center text-xs text-text-subtle">
														No cities found
													</div>
												)}
											</div>
										</div>
									</div>
								</motion.div>
							</div>
						</motion.div>
					</>
				) : null}
			</AnimatePresence>

			{/* Outer wrapper handles fixed positioning (anchored 8px above
			    the slider's top edge). Inner motion.div applies the
			    rubber-band offset so the + button follows the stretched
			    top edge of the slider. */}
			<div
				className={cn(
					"absolute left-1/2 top-0 z-40 flex items-center justify-center transition-opacity duration-200",
					isOpen
						? "opacity-100"
						: "opacity-0 group-hover/city-rail:opacity-100 group-focus-within/city-rail:opacity-100",
				)}
				style={{ transform: "translate(-50%, calc(-100% - 8px))" }}
			>
				<motion.div style={{ y: plusButtonY }}>
					<button
						type="button"
						onClick={() => setIsOpen((current) => !current)}
						className={cn(
							"flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-icon transition-colors",
							isOpen
								? "border-border/70 bg-bg-neutral/70"
								: "hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
						)}
						aria-label="Add city"
					>
						<PlusIcon className="size-3.5" />
					</button>
				</motion.div>
			</div>

			{/* Outer wrapper handles fixed positioning (anchored 8px below
			    the slider's bottom edge). Inner motion.div applies the
			    rubber-band offset so the pin button follows the stretched
			    bottom edge of the slider. */}
			<div
				className={cn(
					"absolute bottom-0 left-1/2 z-40 flex items-center justify-center transition-opacity duration-200",
					// Only surface the pin affordance once the user has
					// manually picked a city (or already pinned one). Keep
					// it visible whenever the manager is open so the user
					// can find/undo the pin from the editor; otherwise only
					// reveal on hover/focus over the slider itself, even
					// when a city is currently pinned.
					isOpen
						? "opacity-100"
						: hasManuallySelectedCity || isPinned
							? "opacity-0 group-hover/city-rail:opacity-100 group-focus-within/city-rail:opacity-100"
							: "pointer-events-none opacity-0",
				)}
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
		</div>
	);
}
