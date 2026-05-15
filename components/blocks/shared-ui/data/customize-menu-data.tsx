import type React from "react";
import AtomIcon from "@atlaskit/icon-lab/core/atom";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import AppsIcon from "@atlaskit/icon/core/apps";
import GlobeIcon from "@atlaskit/icon/core/globe";
import OfficeBuildingIcon from "@atlaskit/icon/core/office-building";
import RandomizeIcon from "@atlaskit/icon-lab/core/randomize";
import SettingsIcon from "@atlaskit/icon/core/settings";
import TelescopeIcon from "@atlaskit/icon-lab/core/telescope";
import ZoomInIcon from "@atlaskit/icon/core/zoom-in";

export interface ReasoningOption {
	id: string;
	label: string;
	description: string;
	icon: React.ReactElement<{ label: string }>;
}

export const DEFAULT_REASONING_OPTION_ID = "let-rovo-decide";

export const REASONING_OPTIONS: ReasoningOption[] = [
	{
		id: "let-rovo-decide",
		label: "Let Rovo decide",
		description: "Rovo picks reasoning for the job",
		icon: <RandomizeIcon label="Let Rovo decide" />,
	},
	{
		id: "think-deeper",
		label: "Think deeper",
		description: "Longer thinking for robust responses",
		icon: <ZoomInIcon label="Think deeper" />,
	},
	{
		id: "deep-research",
		label: "Deep research",
		description: "Synthesize insights and create reports",
		icon: <TelescopeIcon label="Deep research" />,
	},
	{
		id: "max",
		label: "Max",
		description: "Tackles complex work across your tools",
		icon: <AtomIcon label="Max" />,
	},
];

interface SourceToggle {
	id: string;
	label: string;
	icon: React.ReactElement;
}

export const SOURCE_TOGGLES: SourceToggle[] = [
	{
		id: "web-results",
		label: "Include web results",
		icon: <GlobeIcon label="Web results" />,
	},
	{
		id: "company-knowledge",
		label: "Search company knowledge",
		icon: <OfficeBuildingIcon label="Company knowledge" />,
	},
];

export const FILTER_BY_APPS_ICON = <AppsIcon label="Filter by apps" />;
export const SETTINGS_ICON = <SettingsIcon label="Settings" />;
export const SELECTED_CHECK_ICON = <CheckMarkIcon label="Selected" />;
