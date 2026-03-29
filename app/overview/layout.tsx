import type { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("overview"),
	description: "Product analytics overview dashboard",
	openGraph: {
		title: `${getProjectPageTitle("overview")} — VPK`,
		description: "Product analytics overview dashboard",
	},
};

export default function OverviewLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
