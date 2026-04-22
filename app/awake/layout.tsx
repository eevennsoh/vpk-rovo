import type { Metadata } from "next";
import { getArtPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getArtPageTitle("awake"),
	openGraph: {
		title: `${getArtPageTitle("awake")} — VPK`,
	},
};

export default function AwakeLayout({ children }: { children: React.ReactNode }) {
	return children;
}
