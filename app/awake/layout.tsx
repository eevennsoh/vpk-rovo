import type { Metadata } from "next";
import { getArtPageTitle } from "@/lib/project-page-title";

const title = getArtPageTitle("awake");

export const metadata: Metadata = {
	title,
	openGraph: {
		title: `${title} — VPK`,
	},
};

export default function AwakeLayout({ children }: { children: React.ReactNode }) {
	return children;
}
