import AppSwitcherIcon from "@atlaskit/icon/core/app-switcher";
import GlobeIcon from "@atlaskit/icon/core/globe";
import {
	JiraIcon,
	ConfluenceIcon,
	BitbucketIcon,
	CompassIcon,
	JiraServiceManagementIcon,
	JiraProductDiscoveryIcon,
	LoomIcon,
	AssetsIcon,
	ProjectsIcon,
	GoalsIcon,
	FocusIcon,
} from "@/components/ui/logo";

/**
 * Filter item data structure
 */
export interface FilterItem {
	id: string;
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: React.ComponentType<any> | string;
	count?: string;
	actionLabel?: string;
}

/**
 * Product filters with logo/icon imports
 */
export const PRODUCT_FILTERS: FilterItem[] = [
	{ id: "all", name: "All", icon: AppSwitcherIcon, count: "15M" },
	{ id: "confluence", name: "Confluence", icon: ConfluenceIcon, count: "2.9M" },
	{ id: "jira", name: "Jira", icon: JiraIcon, count: "2.6M" },
	{ id: "slack", name: "Slack", icon: "/3p/slack/20.svg", count: "3.1M" },
	{ id: "jsm", name: "Jira Service Management", icon: JiraServiceManagementIcon, count: "2M" },
	{ id: "drive", name: "Google Drive", icon: "/3p/google-drive/20.svg", count: "98K" },
	{ id: "loom", name: "Loom", icon: LoomIcon, count: "28K" },
	{ id: "jpd", name: "Jira Product Discovery", icon: JiraProductDiscoveryIcon, count: "47K" },
	{ id: "assets", name: "Assets", icon: AssetsIcon, count: "8K" },
	{ id: "bitbucket", name: "Bitbucket", icon: BitbucketIcon, count: "6.8K" },
	{ id: "compass", name: "Compass", icon: CompassIcon, count: "672" },
	{ id: "gcal", name: "Google Calendar", icon: "/3p/google-calendar/20.svg", count: "1.3K" },
	{ id: "focus", name: "Focus", icon: FocusIcon, count: "65" },
	{ id: "sharepoint", name: "Microsoft SharePoint", icon: "/3p/microsoft-sharepoint/20.svg", actionLabel: "Connect" },
	{ id: "teams", name: "Microsoft Teams", icon: "/3p/microsoft-teams/20.svg", actionLabel: "Connect" },
	{ id: "miro", name: "Miro", icon: "/3p/miro/20.svg", actionLabel: "Connect" },
];

/**
 * Category filters with logo/icon imports
 */
export const CATEGORY_FILTERS: FilterItem[] = [
	{ id: "projects", name: "Projects", icon: ProjectsIcon },
	{ id: "goals", name: "Goals", icon: GoalsIcon },
	{ id: "webpages", name: "Web pages", icon: GlobeIcon, count: "4.2M" },
];

/**
 * Logo components that require special rendering
 */
export const LOGO_COMPONENTS = [
	ConfluenceIcon,
	JiraIcon,
	BitbucketIcon,
	CompassIcon,
	LoomIcon,
	JiraServiceManagementIcon,
	JiraProductDiscoveryIcon,
	AssetsIcon,
	ProjectsIcon,
	GoalsIcon,
	FocusIcon,
] as const;
