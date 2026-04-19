"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import LiquidGlass from "@/components/website/demos/visual/shaders/liquid-glass";
import { cn } from "@/lib/utils";

import type { LockscreenLocation } from "./locations";
import { PRESET_CITIES } from "./preset-cities";
import { VerticalElasticSlider } from "./vertical-elastic-slider";

interface CityRailEditorProps {
	cities: ReadonlyArray<LockscreenLocation>;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	addCity: (city: LockscreenLocation) => void;
	removeCity: (index: number) => void;
	className?: string;
	height?: number;
	width?: number;
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

function PlusGlyph() {
	return (
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
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}

function MinusGlyph() {
	return (
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
			<line x1="5" y1="12" x2="19" y2="12" />
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
}: Readonly<CityRailEditorProps>) {
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
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
			className={cn("relative overflow-visible", className)}
			style={{ width: railWidth, height }}
		>
			{!isOpen ? (
				<div className="absolute inset-y-0 left-0 z-30" style={{ width: railWidth }}>
					<LiquidGlass
						width={railWidth}
						height={height}
						borderRadius={9999}
						borderWidth={0.05}
						brightness={50}
						opacity={0.93}
						blur={8}
						backgroundOpacity={0.08}
						saturation={1}
						distortionScale={-90}
						dispersion={6}
						borderOpacity={0.35}
						style={squircleShellStyle as CSSProperties}
					>
						<VerticalElasticSlider
							min={0}
							max={Math.max(0, cities.length - 1)}
							step={1}
							value={selectedIndex}
							onValueChange={setSelectedIndex}
							formatValue={(value) => cities[value]?.name?.slice(0, 6) ?? ""}
							label="Cities"
							className="h-full w-full"
							trackShape="none"
							trackClassName="border-transparent bg-transparent"
						/>
					</LiquidGlass>
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
								backgroundOpacity={0.08}
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
									<VerticalElasticSlider
										min={0}
										max={Math.max(0, cities.length - 1)}
										step={1}
										value={selectedIndex}
										onValueChange={setSelectedIndex}
										formatValue={(value) => cities[value]?.name?.slice(0, 6) ?? ""}
										label="Cities"
										className="h-full w-full"
										trackShape="none"
										trackClassName="border-transparent bg-transparent"
										trackStyle={{ borderRadius: "46px 0 0 46px" }}
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
									<div className="flex h-full flex-col border-l border-black/8 px-4 py-4">
										<div className="mb-3 flex items-center gap-3 rounded-full border border-black/8 bg-white/80 px-3 py-2">
											<SearchIcon />
											<input
												ref={searchInputRef}
												type="text"
												value={search}
												onChange={(event) => setSearch(event.target.value)}
												placeholder="Search cities..."
												className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
											/>
										</div>

										<div className="mb-3 flex items-center justify-between px-1">
											<div className="min-w-0">
												<p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-black/45">
													Manage cities
												</p>
												<p className="truncate text-xs text-black/55">
													{cities.length} saved, {selectedCity.name} selected
												</p>
											</div>
											<button
												type="button"
												onClick={() => setIsOpen(false)}
												className="flex h-7 w-7 items-center justify-center rounded-full text-black/45 transition-colors hover:bg-black/6 hover:text-black/75"
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
																		? "border-black/12 bg-black/[0.045]"
																		: "border-transparent bg-white/55 hover:bg-black/[0.04]",
																)}
															>
																<button
																	type="button"
																	onClick={() => {
																		if (isCityAdded) {
																			setSelectedIndex(cityIndex);
																			return;
																		}
																		addCity(city);
																	}}
																	className="min-w-0 flex-1 text-left"
																>
																	<div className="flex items-center gap-2">
																		<span className="truncate text-sm font-medium text-black/85">
																			{city.name}
																		</span>
																		{isSelected ? (
																			<span className="rounded-full bg-black/8 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-black/55">
																				Live
																			</span>
																		) : null}
																	</div>
																	<p className="truncate text-[11px] text-black/45">
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
																			"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/45 transition-colors",
																			disableRemove
																				? "opacity-20"
																				: "hover:bg-black/6 hover:text-black/75",
																		)}
																		aria-label={`Remove ${city.name}`}
																	>
																		<MinusGlyph />
																	</button>
																) : (
																	<button
																		type="button"
																		onClick={() => addCity(city)}
																		className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/45 transition-colors hover:bg-black/6 hover:text-black/75"
																		aria-label={`Add ${city.name}`}
																	>
																		<PlusGlyph />
																	</button>
																)}
															</div>
														);
													})
												) : (
													<div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-black/10 bg-white/55 px-4 py-8 text-center text-xs text-black/40">
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

			<div
				className="absolute left-1/2 top-0 z-40 flex items-center justify-center"
				style={{ transform: "translate(-50%, calc(-100% - 8px))" }}
			>
				<button
					type="button"
					onClick={() => setIsOpen((current) => !current)}
					className={cn(
						"flex h-7 w-7 items-center justify-center rounded-full transition-colors",
						isOpen
							? "bg-black/10 text-black/80"
							: "hover:bg-black/10 active:bg-black/15",
					)}
					aria-label="Add city"
				>
					<PlusGlyph />
				</button>
			</div>

			<div
				className="absolute bottom-0 left-1/2 z-40 flex items-center justify-center"
				style={{ transform: "translate(-50%, calc(100% + 8px))" }}
			>
				<button
					type="button"
					onClick={() => setIsOpen((current) => !current)}
					className={cn(
						"flex h-7 w-7 items-center justify-center rounded-full transition-colors",
						isOpen
							? "bg-black/10 text-black/80"
							: "hover:bg-black/10 active:bg-black/15",
					)}
					aria-label="Manage cities"
				>
					<MinusGlyph />
				</button>
			</div>
		</div>
	);
}
