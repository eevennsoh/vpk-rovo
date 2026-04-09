import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings — VPK",
	description: "Provider routing and runtime controls.",
	openGraph: {
		title: "Settings — VPK",
		description: "Provider routing and runtime controls.",
	},
};

export default function RovoAppSettingsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
