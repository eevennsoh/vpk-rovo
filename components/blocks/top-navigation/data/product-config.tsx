import Image from "next/image";
import {
	AdminIcon,
	HomeIcon,
	JiraIcon,
	ConfluenceIcon,
	ProjectsIcon,
	SearchIcon as SearchLogo,
	StudioIcon,
} from "@/components/ui/logo";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search" | "studio";

interface ProductConfig {
	Icon: typeof HomeIcon;
	name: string;
}

function VpkRovoIcon() {
	return (
		<span className="inline-flex shrink-0 items-center">
			<Image src="/1p/rovo.svg" alt="" width={20} height={20} />
		</span>
	);
}

export const PRODUCT_CONFIG: Record<Product, ProductConfig> = {
	admin: { Icon: AdminIcon, name: "Administration" },
	agents: { Icon: ProjectsIcon, name: "Agents" },
	search: { Icon: SearchLogo, name: "Search" },
	jira: { Icon: JiraIcon, name: "Jira" },
	confluence: { Icon: ConfluenceIcon, name: "Confluence" },
	rovo: { Icon: VpkRovoIcon as typeof HomeIcon, name: "Rovo" },
	studio: { Icon: StudioIcon, name: "Studio" },
	home: { Icon: HomeIcon, name: "Home" },
} as const;
