import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Skills — VPK",
	description: "Browse installed Hermes skills and inspect their content.",
	openGraph: {
		title: "Skills — VPK",
		description: "Browse installed Hermes skills and inspect their content.",
	},
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
	return children;
}

