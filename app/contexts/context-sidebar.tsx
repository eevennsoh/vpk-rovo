"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

type Product = "home" | "jira" | "confluence" | "rovo" | "search";

/**
 * Sidebar State
 */
export interface SidebarState {
	isVisible: boolean;
	isHovered: boolean;
	currentRoute: Product;
}

/**
 * Sidebar Actions
 */
export interface SidebarActions {
	toggleSidebar: () => void;
	setSidebarVisible: (visible: boolean) => void;
	setHovered: (hovered: boolean) => void;
	setCurrentRoute: (route: Product) => void;
}

interface SidebarContextValue {
	state: SidebarState;
	actions: SidebarActions;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
	children: ReactNode;
	defaultVisible?: boolean;
}

export function SidebarProvider({ children, defaultVisible = false }: Readonly<SidebarProviderProps>) {
	const [isVisible, setIsVisible] = useState(defaultVisible);
	const [isHovered, setIsHovered] = useState(false);
	const [currentRoute, setCurrentRoute] = useState<Product>("home");

	const state: SidebarState = useMemo(
		() => ({ isVisible, isHovered, currentRoute }),
		[isVisible, isHovered, currentRoute],
	);

	const toggleSidebar = useCallback(() => setIsVisible((prev) => !prev), []);
	const setSidebarVisible = useCallback((visible: boolean) => setIsVisible(visible), []);
	const setHovered = useCallback((hovered: boolean) => setIsHovered(hovered), []);

	const actions: SidebarActions = useMemo(
		() => ({ toggleSidebar, setSidebarVisible, setHovered, setCurrentRoute }),
		[toggleSidebar, setSidebarVisible, setHovered, setCurrentRoute],
	);

	const value = useMemo(() => ({ state, actions }), [state, actions]);

	return (
		<SidebarContext value={value}>
			{children}
		</SidebarContext>
	);
}

/**
 * Hook to access full Sidebar context.
 * Must be used within a SidebarProvider.
 */
function useSidebarContext(): SidebarContextValue {
	const context = use(SidebarContext);
	if (context === null) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}

/**
 * Hook to access sidebar state.
 */
export function useSidebarState(): SidebarState {
	return useSidebarContext().state;
}

/**
 * Hook to access sidebar actions.
 */
export function useSidebarActions(): SidebarActions {
	return useSidebarContext().actions;
}

/**
 * Legacy convenience hook that returns a flat object matching the old API.
 * Prefer useSidebarState() and useSidebarActions() for new code.
 */
export function useSidebar(): SidebarState & SidebarActions {
	const { state, actions } = useSidebarContext();
	return { ...state, ...actions };
}
