"use client";

import React, { useState } from "react";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import SearchResultCard from "./components/search-result-card";
import AISummaryPanel from "./components/ai-summary-panel";
import FilterPanel from "./components/filter-panel";
import { MOCK_RESULTS } from "./data/mock-results";
import { SEARCH_TERMS } from "./data/search-terms";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import FileIcon from "@atlaskit/icon/core/file";
import FilterIcon from "@atlaskit/icon/core/filter";
import PersonIcon from "@atlaskit/icon/core/person";

// Icons

export default function SearchResultsView() {
	const [selectedFilter, setSelectedFilter] = useState("all");

	// Filter results based on selected filter
	const filteredResults = selectedFilter === "all" ? MOCK_RESULTS : MOCK_RESULTS.filter((result) => result.type === selectedFilter);

	return (
		<div
			style={{
				height: "var(--vpk-project-shell-content-height, calc(100vh - 48px))",
				display: "flex",
				flexDirection: "column",
			}}
		>
			{/* Filter Buttons Section */}
			<div
				style={{
					paddingTop: token("space.200"),
					paddingBottom: token("space.200"),
					display: "flex",
					justifyContent: "center",
					borderBottom: `1px solid ${token("color.border")}`,
				}}
			>
				<div className="flex w-full max-w-[1104px] flex-wrap gap-2 px-2">
					{/* Filter icon button */}
					<Button aria-label="Filter" size="icon" variant="ghost">
						<FilterIcon label="" />
					</Button>

					{/* Last updated button */}
					<Button className="gap-2" variant="secondary">
						<CalendarIcon label="" />
						<span>Last updated</span>
						<ChevronDownIcon label="" size="small" />
					</Button>

					{/* Type button */}
					<Button className="gap-2" variant="secondary">
						<FileIcon label="" />
						<span>Type</span>
						<ChevronDownIcon label="" size="small" />
					</Button>

					{/* Contributor button */}
					<Button className="gap-2" variant="secondary">
						<PersonIcon label="" />
						<span>Contributor</span>
						<ChevronDownIcon label="" size="small" />
					</Button>
				</div>
			</div>

			{/* Main Content - Two Column Layout */}
			<div
				style={{
					flex: 1,
					display: "flex",
					justifyContent: "center",
					overflowY: "auto",
				}}
			>
				<div
					className="flex w-full max-w-[1104px] flex-col gap-6 px-2 xl:flex-row xl:gap-12"
					style={{ paddingTop: token("space.200") }}
				>
					{/* Left Column - Results */}
					<div
						className="min-w-0 flex-1"
						style={{
							paddingTop: token("space.100"),
							paddingBottom: "20px",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: token("space.300") }}>
							{/* AI Summary Panel */}
							<AISummaryPanel defaultExpanded={false} />

							{filteredResults.map((result) => (
								<SearchResultCard
									key={result.id}
									icon={result.icon}
									iconColor={result.iconColor}
									title={result.title}
									metadata={result.metadata}
									excerpt={result.excerpt}
									searchTerms={[...SEARCH_TERMS]}
									onClick={() => {
										// Click handler - implement navigation as needed
									}}
								/>
							))}
						</div>
					</div>

					{/* Right Column - Filters */}
					<div className="w-full shrink-0 xl:w-[264px]">
						<FilterPanel selectedFilter={selectedFilter} onFilterChange={setSelectedFilter} />
					</div>
				</div>
			</div>
		</div>
	);
}
