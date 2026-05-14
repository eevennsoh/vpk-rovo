"use client";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import SearchSuggestionsPanel from "./components/search-suggestions-panel";
import { LeftNavigation } from "./components/left-navigation";
import { RightNavigation } from "./components/right-navigation";
import { CreateButton } from "./components/create-button";
import { useTopNavigation } from "./hooks/use-top-navigation";
import { TOP_NAV_LEFT_SECTION_WIDTH_PX, TOP_NAV_PADDING_PX } from "./layout-constants";
import SearchIcon from "@atlaskit/icon/core/search";

type Product = "admin" | "home" | "jira" | "confluence" | "rovo" | "search";

interface TopNavigationProps {
	product: Product;
	showSearch?: boolean;
	hideRovoAction?: boolean;
}

export default function TopNavigation({
	product,
	showSearch = true,
	hideRovoAction = false,
}: Readonly<TopNavigationProps>) {
	const {
		searchValue,
		setSearchValue,
		isAppSwitcherOpen,
		isSearchFocused,
		windowWidth,
		isVisible,
		toggleSidebar,
		toggleChat,
		toggleTheme,
		searchContainerRef,
		searchPanelRef,
		centerSectionStyle,
		handleNavigate,
		handleSearchKeyDown,
		handleSearchAllApps,
		handleRecentItemClick,
		handleRecentSearchClick,
		handleFocusSearch,
		handleToggleAppSwitcher,
		handleCloseAppSwitcher,
		handleHoverEnter,
		handleHoverLeave,
	} = useTopNavigation();

	return (
		<div
			style={{
				backgroundColor: token("elevation.surface"),
				borderBottom: `1px solid ${token("color.border")}`,
				height: "48px",
				position: "sticky",
				top: 0,
				zIndex: 100,
				alignItems: "center",
			}}
		>
			<div
				style={{
					height: "100%",
					paddingLeft: token("space.150"),
					paddingRight: token("space.150"),
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					position: "relative",
				}}
			>
				{isVisible && (
					<div
						style={{
							position: "absolute",
							bottom: -1,
							left: 0,
							width: `${TOP_NAV_LEFT_SECTION_WIDTH_PX}px`,
							height: "1px",
							backgroundColor: token("elevation.surface"),
							zIndex: 1,
						}}
					/>
				)}

				<div style={{ flex: 1 }}>
					<LeftNavigation
						product={product}
						windowWidth={windowWidth}
						isVisible={isVisible}
						isAppSwitcherOpen={isAppSwitcherOpen}
						separatorLineOffsetPx={TOP_NAV_LEFT_SECTION_WIDTH_PX - TOP_NAV_PADDING_PX}
						onToggleSidebar={toggleSidebar}
						onToggleAppSwitcher={handleToggleAppSwitcher}
						onCloseAppSwitcher={handleCloseAppSwitcher}
						onNavigate={handleNavigate}
						onHoverEnter={handleHoverEnter}
						onHoverLeave={handleHoverLeave}
					/>
				</div>

				{showSearch ? (
					<div style={centerSectionStyle}>
						<div
							ref={searchContainerRef}
							className="search-box-wrapper"
							style={{ position: "relative", flex: 1 }}
						>
							<InputGroup
								className={cn(
									"h-7 rounded-md bg-bg-input shadow-none transition-[height,background-color,box-shadow] duration-medium ease-out hover:bg-bg-input-hovered",
									"has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0",
									isSearchFocused && "h-9 relative z-[1001]",
								)}
								style={
									isSearchFocused
										? {
												backgroundColor: token("elevation.surface.overlay"),
												boxShadow: token("elevation.shadow.overlay"),
											}
										: undefined
								}
							>
								<InputGroupAddon align="inline-start">
									<span className="size-4 shrink-0 text-icon-subtle">
										<SearchIcon label="" spacing="none" />
									</span>
								</InputGroupAddon>
								<InputGroupInput
									type="search"
									aria-label="Search"
									value={searchValue}
									onChange={(event) => setSearchValue(event.currentTarget.value)}
									onFocus={handleFocusSearch}
									onKeyDown={handleSearchKeyDown}
									placeholder="Search"
									className="h-full text-sm placeholder:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
								/>
							</InputGroup>
							<SearchSuggestionsPanel
								anchorRef={searchContainerRef}
								isVisible={isSearchFocused}
								onSearchAllApps={handleSearchAllApps}
								onRecentItemClick={handleRecentItemClick}
								onRecentSearchClick={handleRecentSearchClick}
								panelRef={searchPanelRef}
							/>
						</div>

						<CreateButton windowWidth={windowWidth} />
					</div>
				) : null}

				<RightNavigation
					product={product}
					windowWidth={windowWidth}
					hideRovoAction={hideRovoAction}
					onToggleChat={toggleChat}
					onToggleTheme={toggleTheme}
				/>
			</div>
		</div>
	);
}
