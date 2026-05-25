import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Memories — VPK",
	description: "Memory entries and character usage.",
	openGraph: {
		title: "Memories — VPK",
		description: "Memory entries and character usage.",
	},
};

export default function RovoAppMemoriesLayout({ children }: { children: React.ReactNode }) {
	return children;
}
