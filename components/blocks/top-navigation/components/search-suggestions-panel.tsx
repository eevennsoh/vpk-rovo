"use client";

import { useEffect, useRef, type KeyboardEvent, type Ref } from "react";
import { token } from "@/lib/tokens";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RECENT_SEARCHES, RECENT_ITEMS } from "../data/search-data";
import FilterButtonBar from "./filter-button-bar";
import RecentSearchItem from "./recent-search-item";
import RecentItemCard from "./recent-item-card";
import SearchAllAppsFooter from "./search-all-apps-footer";
import SearchIcon from "@atlaskit/icon/core/search";

interface SearchSuggestionsPanelProps {
	ref?: Ref<HTMLDivElement>;
	isVisible: boolean;
	searchValue: string;
	onSearchChange: (value: string) => void;
	onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
	onClose?: () => void;
	onSearchAllApps?: () => void;
	onRecentItemClick?: (title: string) => void;
	onRecentSearchClick?: (query: string) => void;
}

export default function SearchSuggestionsPanel({
	ref,
	isVisible,
	searchValue,
	onSearchChange,
	onSearchKeyDown,
	onSearchAllApps,
	onRecentItemClick,
	onRecentSearchClick,
}: Readonly<SearchSuggestionsPanelProps>) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isVisible) {
			return undefined;
		}

		const timeoutId = window.setTimeout(() => {
			inputRef.current?.focus();
		}, 10);

		return () => window.clearTimeout(timeoutId);
	}, [isVisible]);

	if (!isVisible) {
		return null;
	}

	return (
		<div
			ref={ref}
			style={{
				position: "absolute",
				top: "-4px",
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 1000,
				width: "780px",
				maxWidth: "calc(100vw - 24px)",
			}}
		>
			<div
				style={{
					width: "100%",
					height: "36px",
					backgroundColor: token("elevation.surface.overlay"),
					borderRadius: "8px",
					boxShadow: token("elevation.shadow.overlay"),
					display: "flex",
					alignItems: "center",
					marginBottom: "8px",
				}}
			>
				<InputGroup
					className="h-9 flex-1 border-0 bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
				>
					<InputGroupAddon align="inline-start">
						<span className="size-4 shrink-0 text-icon-subtle">
							<SearchIcon label="" spacing="none" />
						</span>
					</InputGroupAddon>
					<InputGroupInput
						ref={inputRef}
						type="search"
						aria-label="Search"
						value={searchValue}
						onChange={(event) => onSearchChange(event.currentTarget.value)}
						onKeyDown={onSearchKeyDown}
						placeholder="Search"
						autoFocus
						className="h-full text-sm placeholder:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
					/>
				</InputGroup>
			</div>

			<div
				style={{
					width: "100%",
					height: "530px",
					backgroundColor: token("elevation.surface.overlay"),
					borderRadius: "12px",
					boxShadow: token("elevation.shadow.overlay"),
					padding: "8px 0",
					overflow: "hidden",
				}}
			>
				<FilterButtonBar />

				<div style={{ padding: "0 8px" }}>
					{RECENT_SEARCHES.map((search) => (
						<RecentSearchItem
							key={search}
							query={search}
							onClick={() => onRecentSearchClick?.(search)}
						/>
					))}
				</div>

				<div style={{ marginTop: "8px", padding: "0 8px" }}>
					<div
						style={{
							font: token("font.body.small"),
							fontWeight: token("font.weight.bold"),
							color: token("color.text.subtlest"),
							letterSpacing: "0.06em",
							padding: "8px 12px 4px",
						}}
					>
						RECENT
					</div>

					{RECENT_ITEMS.map((item) => (
						<RecentItemCard
							key={`${item.title}-${item.timestamp}`}
							title={item.title}
							metadata={item.metadata}
							timestamp={item.timestamp}
							onClick={() => onRecentItemClick?.(item.title)}
						/>
					))}
				</div>

				<SearchAllAppsFooter onClick={onSearchAllApps} />
			</div>
		</div>
	);
}
