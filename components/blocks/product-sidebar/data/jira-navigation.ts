import { ConfluenceLogo, LoomLogoWrapper, GoalsLogo, TeamsLogo } from "../components/product-logos";

export interface StarredProject {
	id: string;
	name: string;
	imageSrc: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>;

export interface ExternalLink {
	id: string;
	label: string;
	icon: IconComponent;
	href?: string;
}

export const STARRED_PROJECTS: readonly StarredProject[] = [
	{
		id: "enterprise-rfp-qualification",
		name: "Enterprise RFP Qualification",
		imageSrc: "/avatar-project/rocket.svg",
	},
	{
		id: "enterprise-rfp-pipeline",
		name: "Enterprise RFP Pipeline",
		imageSrc: "/avatar-project/code.svg",
	},
	{
		id: "rfp-pursuit-team",
		name: "RFP Pursuit Team",
		imageSrc: "/avatar-project/science.svg",
	},
] as const;

export const JIRA_EXTERNAL_LINKS: readonly ExternalLink[] = [
	{
		id: "confluence",
		label: "Confluence",
		icon: ConfluenceLogo,
		href: "/confluence",
	},
	{
		id: "loom",
		label: "Loom",
		icon: LoomLogoWrapper,
	},
	{
		id: "goals",
		label: "Goals",
		icon: GoalsLogo,
	},
	{
		id: "teams",
		label: "Teams",
		icon: TeamsLogo,
	},
] as const;
