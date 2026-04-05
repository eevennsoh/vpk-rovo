"use client";

import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useWindowWidth } from "@/components/hooks/use-window-width";
import { useClickOutside } from "@/components/hooks/use-click-outside";
import { useSidebar } from "@/app/contexts/context-sidebar";
import { useTheme } from "@/components/utils/theme-wrapper";
import { token } from "@/lib/tokens";

export function useTopNavigation() {
	const router = useRouter();
	const [searchValue, setSearchValue] = useState("");
	const [isAppSwitcherOpen, setIsAppSwitcherOpen] = useState(false);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const windowWidth = useWindowWidth();
	const { isVisible, toggleSidebar, setHovered } = useSidebar();
	const { setTheme, actualTheme } = useTheme();
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const searchPanelRef = useRef<HTMLDivElement>(null);

	const searchRefs = useMemo(() => [searchContainerRef, searchPanelRef], []);

	useClickOutside(searchRefs, () => setIsSearchFocused(false), isSearchFocused);

	const toggleTheme = useCallback(() => {
		setTheme(actualTheme === "light" ? "dark" : "light");
	}, [setTheme, actualTheme]);

	const toggleChat = useCallback(() => {
		router.push("/rovo-app");
	}, [router]);

	const handleNavigate = useCallback(
		(path: string) => {
			router.push(path);
			setIsAppSwitcherOpen(false);
		},
		[router]
	);

	const handleSearchKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Enter") {
				router.push("/rovo-app");
				setIsSearchFocused(false);
			}
			if (event.key === "Escape") {
				setIsSearchFocused(false);
			}
		},
		[router]
	);

	const handleSearchAllApps = useCallback(() => {
		router.push("/rovo-app");
	}, [router]);

	const handleRecentItemClick = useCallback(() => {
		setIsSearchFocused(false);
	}, []);

	const handleRecentSearchClick = useCallback(
		(query: string) => {
			setSearchValue(query);
			router.push("/rovo-app");
			setIsSearchFocused(false);
		},
		[router]
	);

	const handleCloseSearch = useCallback(() => setIsSearchFocused(false), []);
	const handleFocusSearch = useCallback(() => setIsSearchFocused(true), []);
	const handleToggleAppSwitcher = useCallback(() => setIsAppSwitcherOpen((prev) => !prev), []);
	const handleCloseAppSwitcher = useCallback(() => setIsAppSwitcherOpen(false), []);
	const handleHoverEnter = useCallback(() => setHovered(true), [setHovered]);
	const handleHoverLeave = useCallback(() => setHovered(false), [setHovered]);

	const centerSectionStyle = useMemo(() => {
		const base = {
			display: "flex",
			alignItems: "center",
			gap: token("space.100"),
			width: "100%",
			minWidth: 0,
			maxWidth: "762px",
			flex: 1,
			paddingLeft: token("space.150"),
			paddingRight: token("space.150"),
		};

		if (windowWidth >= 1516) {
			return base;
		}
		if (windowWidth >= 1028) {
			return { ...base, minWidth: "292px" };
		}
		return { ...base, maxWidth: "none", paddingLeft: token("space.100"), paddingRight: token("space.100") };
	}, [windowWidth]);

	return {
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
		handleCloseSearch,
		handleFocusSearch,
		handleToggleAppSwitcher,
		handleCloseAppSwitcher,
		handleHoverEnter,
		handleHoverLeave,
	};
}
