import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Skills — VPK",
	description: "Installed skills and skill details.",
	openGraph: {
		title: "Skills — VPK",
		description: "Installed skills and skill details.",
	},
};

export default function RovoAppSkillsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
