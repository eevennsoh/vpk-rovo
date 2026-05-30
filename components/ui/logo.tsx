"use client";

import * as React from "react";
import { type LogoProps as AtlaskitLogoProps } from "@atlaskit/logo";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/utils/theme-wrapper";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import {
	type AtlassianLogoName,
	LOGO_ICON_COMPONENTS,
	LOGO_LOCKUP_COMPONENTS,
	CUSTOM_LOGO_SIZES,
} from "@/components/ui/data/logo-data";

export type { AtlassianLogoName };
export type LogoVariant = "icon" | "lockup";

export interface LogoProps extends AtlaskitLogoProps {
	color?: string;
	themeAware?: boolean;
	variant?: LogoVariant;
	shouldUseHexLogo?: boolean;
	/**
	 * Draws a 1px hairline directly on the logo mark's edge (inset ring, no
	 * added size) so adjacent same-color marks stay visually separated — e.g.
	 * blue Jira over blue Confluence in an overlapping stack. Defaults to off.
	 */
	hasBorder?: boolean;
}

export interface AtlassianLogoProps extends LogoProps {
	name: AtlassianLogoName;
}

function getThemeAwareAppearance(
	appearance: AtlaskitLogoProps["appearance"],
	themeAware: boolean,
	actualTheme: "light" | "dark"
): AtlaskitLogoProps["appearance"] {
	if (appearance) {
		return appearance;
	}

	if (!themeAware) {
		return undefined;
	}

	return actualTheme === "dark" ? "inverse" : "brand";
}

function getLogoSizePx(size: AtlaskitLogoProps["size"]): number {
	if (typeof size === "string") {
		const numericSize = Number(size);
		if (!Number.isNaN(numericSize)) {
			return numericSize;
		}

		return CUSTOM_LOGO_SIZES[size] ?? CUSTOM_LOGO_SIZES.small;
	}

	return CUSTOM_LOGO_SIZES.small;
}

export function AtlassianLogo({
	name,
	themeAware = true,
	appearance,
	size = "small",
	variant = "icon",
	shouldUseNewLogoDesign = true,
	hasBorder = false,
	color,
	...props
}: Readonly<AtlassianLogoProps>) {
	const isMounted = useIsMounted();
	const { actualTheme } = useTheme();
	const components = variant === "lockup" ? LOGO_LOCKUP_COMPONENTS : LOGO_ICON_COMPONENTS;
	const Component = components[name];
	const resolvedAppearance = getThemeAwareAppearance(appearance, themeAware, actualTheme);
	void color;

	const needsDarkFix = !appearance && actualTheme === "dark" && resolvedAppearance === "inverse";
	const placeholderSize = getLogoSizePx(size);
	// Hairline drawn as an outline with a negative offset: it sits 1px inside the
	// mark's edge and — unlike an inset ring/box-shadow, which renders *behind*
	// content — outlines paint on top of the filled logo svg, so it stays visible.
	const borderClassName = hasBorder && "rounded-tile [outline:1px_solid_var(--color-border)] [outline-offset:-1px]";

	if (!isMounted) {
		return (
			<span className={cn("inline-flex shrink-0 items-center", borderClassName, needsDarkFix && "ads-logo-inverse")}>
				<span
					aria-hidden
					className="inline-block shrink-0"
					style={{ width: placeholderSize, height: placeholderSize }}
				/>
			</span>
		);
	}

	return (
		<span className={cn("inline-flex shrink-0 items-center", borderClassName, needsDarkFix && "ads-logo-inverse")}>
			<Component
				{...props}
				size={size}
				appearance={resolvedAppearance}
				shouldUseNewLogoDesign={shouldUseNewLogoDesign}
			/>
		</span>
	);
}

/* -- Custom Logo ------------------------------------------------- */

export interface CustomLogoProps {
	/** Custom SVG or image element to render as the logo icon */
	svg: React.ReactElement<{ width?: number; height?: number; "aria-hidden"?: boolean }>;
	/** Optional wordmark text displayed beside the icon */
	wordmark?: string;
	/** Logo size */
	size?: LogoProps["size"];
	/** Accessible label */
	label?: string;
	/** Additional CSS classes */
	className?: string;
}

export function CustomLogo({
	svg,
	wordmark,
	size = "small",
	label,
	className,
}: Readonly<CustomLogoProps>) {
	const px = CUSTOM_LOGO_SIZES[size ?? "small"];

	return (
		<span
			role="img"
			aria-label={label}
			className={cn("inline-flex items-center gap-1", className)}
		>
			<span className="inline-flex shrink-0 items-center justify-center" style={{ width: px, height: px }}>
				{React.cloneElement(svg, {
					width: px,
					height: px,
					"aria-hidden": true,
				})}
			</span>
			{wordmark ? (
				<span
					className="font-semibold leading-none text-text"
					style={{ fontSize: Math.max(12, px * 0.6) }}
				>
					{wordmark}
				</span>
			) : null}
		</span>
	);
}

/* -- Named product exports --------------------------------------- */

function createLogo(name: AtlassianLogoName) {
	return function LogoComponent(props: Readonly<LogoProps>) {
		return <AtlassianLogo name={name} {...props} />;
	};
}

export const AdminIcon = createLogo("admin");
export const AlignIcon = createLogo("align");
export const AnalyticsIcon = createLogo("analytics");
export const AssetsIcon = createLogo("assets");
export const AtlassianBrandIcon = createLogo("atlassian");
export const BambooIcon = createLogo("bamboo");
export const BitbucketIcon = createLogo("bitbucket");
export const ChatIcon = createLogo("chat");
export const CompassIcon = createLogo("compass");
export const ConfluenceIcon = createLogo("confluence");
export const CustomerServiceManagementIcon = createLogo("customer-service-management");
export const FocusIcon = createLogo("focus");
export const GoalsIcon = createLogo("goals");
export const GuardIcon = createLogo("guard");
export const HomeIcon = createLogo("home");
export const HubIcon = createLogo("hub");
export const JiraIcon = createLogo("jira");
export const JiraProductDiscoveryIcon = createLogo("jira-product-discovery");
export const JiraServiceManagementIcon = createLogo("jira-service-management");
export const LoomIcon = createLogo("loom");
export const OpsgenieIcon = createLogo("opsgenie");
export const ProjectsIcon = createLogo("projects");
export const RovoIcon = createLogo("rovo");
export const RovoDevIcon = createLogo("rovo-dev");
export const RovoDevAgentIcon = createLogo("rovo-dev-agent");
export const SearchIcon = createLogo("search");
export const StatuspageIcon = createLogo("statuspage");
export const StudioIcon = createLogo("studio");
export const TalentIcon = createLogo("talent");
export const TeamsIcon = createLogo("teams");
export const TrelloIcon = createLogo("trello");

export const AdminLogo = AdminIcon;
export const AlignLogo = AlignIcon;
export const AnalyticsLogo = AnalyticsIcon;
export const AssetsLogo = AssetsIcon;
export const AtlassianBrandLogo = AtlassianBrandIcon;
export const BambooLogo = BambooIcon;
export const BitbucketLogo = BitbucketIcon;
export const ChatLogo = ChatIcon;
export const CompassLogo = CompassIcon;
export const ConfluenceLogo = ConfluenceIcon;
export const CustomerServiceManagementLogo = CustomerServiceManagementIcon;
export const FocusLogo = FocusIcon;
export const GoalsLogo = GoalsIcon;
export const GuardLogo = GuardIcon;
export const HomeLogo = HomeIcon;
export const HubLogo = HubIcon;
export const JiraLogo = JiraIcon;
export const JiraProductDiscoveryLogo = JiraProductDiscoveryIcon;
export const JiraServiceManagementLogo = JiraServiceManagementIcon;
export const LoomLogo = LoomIcon;
export const OpsgenieLogo = OpsgenieIcon;
export const ProjectsLogo = ProjectsIcon;
export const RovoLogo = RovoIcon;
export const RovoDevLogo = RovoDevIcon;
export const RovoDevAgentLogo = RovoDevAgentIcon;
export const SearchLogo = SearchIcon;
export const StatuspageLogo = StatuspageIcon;
export const StudioLogo = StudioIcon;
export const TalentLogo = TalentIcon;
export const TeamsLogo = TeamsIcon;
export const TrelloLogo = TrelloIcon;
