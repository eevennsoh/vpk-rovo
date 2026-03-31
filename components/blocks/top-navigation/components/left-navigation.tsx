"use client";

import { useRef, useMemo, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { useClickOutside } from "@/components/hooks/use-click-outside";
import { AppSwitcherMenu } from "./app-switcher-menu";
import { PRODUCT_CONFIG } from "../data/product-config";
import {
	TOP_NAV_COLLAPSED_CONTROL_STEP_PX,
	TOP_NAV_CONTROL_GAP_PX,
	TOP_NAV_ICON_BUTTON_SIZE_PX,
	TOP_NAV_LEFT_SECTION_WIDTH_PX,
	TOP_NAV_SIDEBAR_TOGGLE_SEPARATOR_GAP_PX,
} from "../layout-constants";
import AppSwitcherIcon from "@atlaskit/icon/core/app-switcher";
import SidebarCollapseIcon from "@atlaskit/icon/core/sidebar-collapse";
import SidebarExpandIcon from "@atlaskit/icon/core/sidebar-expand";

type Product = "home" | "jira" | "confluence" | "rovo" | "search";

interface LeftNavigationProps {
	product: Product;
	windowWidth: number;
	isVisible: boolean;
	isAppSwitcherOpen: boolean;
	hideAppSwitcher?: boolean;
	separatorLineOffsetPx?: number;
	onToggleSidebar: () => void;
	onToggleAppSwitcher: () => void;
	onCloseAppSwitcher: () => void;
	onNavigate: (path: string) => void;
	onHoverEnter: () => void;
	onHoverLeave: () => void;
}

export function LeftNavigation({
	product,
	windowWidth,
	isVisible,
	isAppSwitcherOpen,
	hideAppSwitcher = false,
	separatorLineOffsetPx = TOP_NAV_LEFT_SECTION_WIDTH_PX,
	onToggleSidebar,
	onToggleAppSwitcher,
	onCloseAppSwitcher,
	onNavigate,
	onHoverEnter,
	onHoverLeave,
}: Readonly<LeftNavigationProps>) {
	const appSwitcherButtonRef = useRef<HTMLButtonElement>(null);
	const appSwitcherMenuRef = useRef<HTMLDivElement>(null);

	const appSwitcherRefs: RefObject<HTMLElement | null>[] = useMemo(
		() => [appSwitcherButtonRef, appSwitcherMenuRef],
		[]
	);

	useClickOutside(appSwitcherRefs, onCloseAppSwitcher, isAppSwitcherOpen);

	const { Icon, name } = PRODUCT_CONFIG[product];
	const sidebarToggleOffsetPx =
		separatorLineOffsetPx -
		TOP_NAV_SIDEBAR_TOGGLE_SEPARATOR_GAP_PX -
		TOP_NAV_ICON_BUTTON_SIZE_PX;
	const expandedNavMinWidthPx = sidebarToggleOffsetPx + TOP_NAV_ICON_BUTTON_SIZE_PX;
	const productButtonLeftPx =
		(hideAppSwitcher ? 0 : TOP_NAV_COLLAPSED_CONTROL_STEP_PX) +
		(isVisible ? 0 : TOP_NAV_COLLAPSED_CONTROL_STEP_PX);

	const containerStyle = useMemo(() => {
		const base = {
			display: "flex",
			alignItems: "center",
			gap: TOP_NAV_CONTROL_GAP_PX,
			flex: "0 0 auto" as const,
			position: "relative" as const,
			pointerEvents: "none" as const,
			zIndex: 101,
			height: "100%",
		};

		if (windowWidth >= 1028 && windowWidth < 1516) {
			return { ...base, flex: "0 0 330px", width: "330px" };
		}
		if (windowWidth < 1028 && !isVisible) {
			return { ...base, minWidth: "120px" };
		}
		if (windowWidth < 1028 && isVisible) {
			return { ...base, minWidth: `${expandedNavMinWidthPx}px` };
		}
		return base;
	}, [expandedNavMinWidthPx, windowWidth, isVisible]);

	return (
		<div style={containerStyle}>
			<SidebarToggle
				isVisible={isVisible}
				offsetPx={sidebarToggleOffsetPx}
				onToggle={onToggleSidebar}
				onHoverEnter={onHoverEnter}
				onHoverLeave={onHoverLeave}
			/>

			{hideAppSwitcher ? null : (
				<AppSwitcher
					isOpen={isAppSwitcherOpen}
					isVisible={isVisible}
					buttonRef={appSwitcherButtonRef}
					menuRef={appSwitcherMenuRef}
					onToggle={onToggleAppSwitcher}
					onNavigate={onNavigate}
				/>
			)}

			<div
				style={{
					position: "absolute",
					left: `${productButtonLeftPx}px`,
					transition: "left var(--duration-medium) var(--ease-in-out)",
					display: "flex",
					alignItems: "center",
					height: "100%",
					pointerEvents: "none",
				}}
			>
				<Button
					aria-label={`Open ${name}`}
					variant="ghost"
					className="flex items-center gap-1.5"
					style={{ height: 32, padding: token("space.050"), pointerEvents: "auto" }}
					onClick={() => onNavigate("/")}
				>
					<span className="inline-flex shrink-0 [&_svg]:!size-6">
						<Icon variant="icon" size="small" />
					</span>
					{windowWidth >= 1028 ? (
						<span
							className="max-w-[280px] truncate text-sm font-bold text-text"
							style={{ paddingRight: token("space.025") }}
						>
							{name}
						</span>
					) : null}
				</Button>
			</div>
		</div>
	);
}

interface SidebarToggleProps {
	isVisible: boolean;
	offsetPx: number;
	onToggle: () => void;
	onHoverEnter: () => void;
	onHoverLeave: () => void;
}

function SidebarToggle({
	isVisible,
	offsetPx,
	onToggle,
	onHoverEnter,
	onHoverLeave,
}: Readonly<SidebarToggleProps>) {
	return (
		<div
			style={{
				position: "absolute",
				left: isVisible ? `${offsetPx}px` : "0",
				transition: "left var(--duration-medium) var(--ease-in-out)",
				display: "flex",
				alignItems: "center",
				height: "100%",
				pointerEvents: "none",
			}}
		>
			<Button
				aria-label={isVisible ? "Collapse sidebar" : "Expand sidebar"}
				size="icon"
				variant="ghost"
				onClick={onToggle}
				onMouseEnter={onHoverEnter}
				onMouseLeave={onHoverLeave}
				style={{ pointerEvents: "auto" }}
			>
				{isVisible ? <SidebarCollapseIcon label="" color={token("color.icon.subtle")} /> : <SidebarExpandIcon label="" color={token("color.icon.subtle")} />}
			</Button>
		</div>
	);
}

interface AppSwitcherProps {
	isOpen: boolean;
	isVisible: boolean;
	buttonRef: React.RefObject<HTMLButtonElement | null>;
	menuRef: React.RefObject<HTMLDivElement | null>;
	onToggle: () => void;
	onNavigate: (path: string) => void;
}

function AppSwitcher({
	isOpen,
	isVisible,
	buttonRef,
	menuRef,
	onToggle,
	onNavigate,
}: Readonly<AppSwitcherProps>) {
	return (
		<div
			style={{
				position: "absolute",
				left: isVisible ? "0" : `${TOP_NAV_COLLAPSED_CONTROL_STEP_PX}px`,
				transition: "left var(--duration-medium) var(--ease-in-out)",
				display: "flex",
				alignItems: "center",
				height: "100%",
				pointerEvents: "none",
			}}
		>
			<div style={{ position: "relative", pointerEvents: "auto" }}>
				<Button
					ref={buttonRef}
					aria-label="Switch apps"
					size="icon"
					variant={isOpen ? "secondary" : "ghost"}
					onClick={onToggle}
				>
					<AppSwitcherIcon label="" color={token("color.icon.subtle")} />
				</Button>
				{isOpen ? (
					<div
						ref={menuRef}
						style={{
							position: "absolute",
							top: "100%",
							left: 0,
							marginTop: token("space.100"),
							zIndex: 200,
						}}
					>
						<AppSwitcherMenu onNavigate={onNavigate} />
					</div>
				) : null}
			</div>
		</div>
	);
}
