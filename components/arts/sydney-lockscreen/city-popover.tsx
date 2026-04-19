"use client";

import { useState, useMemo } from "react";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { LockscreenLocation } from "./locations";
import { PRESET_CITIES } from "./preset-cities";

interface CityPopoverProps {
	onAddCity: (city: LockscreenLocation) => void;
	isAdded: (id: string) => boolean;
	className?: string;
}

export function CityPopover({ onAddCity, isAdded, className }: CityPopoverProps) {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);

	const filtered = useMemo(() => {
		if (!search.trim()) return PRESET_CITIES;
		const q = search.toLowerCase();
		return PRESET_CITIES.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.region.toLowerCase().includes(q),
		);
	}, [search]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				className={cn(
					"flex h-7 w-7 items-center justify-center rounded-full transition-colors",
					"hover:bg-black/10 active:bg-black/15",
					className,
				)}
				aria-label="Add city"
			>
				<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
			</PopoverTrigger>

			<PopoverContent
				side="right"
				sideOffset={12}
				className="w-56 p-0"
			>
				<div className="flex items-center gap-2 border-b px-3 py-2">
					<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="shrink-0 opacity-40"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
					<input
						type="text"
						placeholder="Search cities..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-6 w-full bg-transparent text-sm outline-none placeholder:opacity-40"
						autoFocus
					/>
				</div>

				<div className="max-h-[240px] overflow-y-auto py-1">
					{filtered.length === 0 ? (
						<div className="px-3 py-4 text-center text-xs opacity-40">
							No cities found
						</div>
					) : (
						filtered.map((city) => {
							const added = isAdded(city.id);
							return (
								<button
									key={city.id}
									type="button"
									disabled={added}
									onClick={() => {
										onAddCity(city);
										setOpen(false);
										setSearch("");
									}}
									className={cn(
										"flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors",
										added
											? "opacity-40"
											: "hover:bg-black/5 active:bg-black/10",
									)}
								>
									<div className="flex flex-col">
										<span className="font-medium">{city.name}</span>
										<span className="text-[10px] opacity-50">
											{city.region}
										</span>
									</div>
									{added ? (
										<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60"><polyline points="20 6 9 17 4 12" /></svg>
									) : null}
								</button>
							);
						})
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
