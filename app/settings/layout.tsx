import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings — VPK",
	description: "Runtime status, provider routing, and integration controls.",
	openGraph: {
		title: "Settings — VPK",
		description: "Runtime status, provider routing, and integration controls.",
	},
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	return children;
}

