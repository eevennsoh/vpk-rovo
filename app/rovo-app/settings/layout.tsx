import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings — VPK",
	description: "Provider routing, Hermes memory overview, and wiki mirror controls.",
	openGraph: {
		title: "Settings — VPK",
		description: "Provider routing, Hermes memory overview, and wiki mirror controls.",
	},
};

export default function RovoAppSettingsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
