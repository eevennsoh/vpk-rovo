import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Memories — VPK",
	description: "Hermes-style memory browser and editor.",
	openGraph: {
		title: "Memories — VPK",
		description: "Hermes-style memory browser and editor.",
	},
};

export default function MemoriesLayout({ children }: { children: React.ReactNode }) {
	return children;
}

