import type { Metadata } from "next";
import { getCategoryDisplayName } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getCategoryDisplayName("arts"),
	description: "Browse VPK art studies and experiments.",
	openGraph: {
		title: `${getCategoryDisplayName("arts")} — VPK`,
		description: "Browse VPK art studies and experiments.",
	},
};

export default function ArtsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
