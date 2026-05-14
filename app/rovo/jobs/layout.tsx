import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Jobs — VPK",
	description: "Local scheduling and run management surface.",
	openGraph: {
		title: "Jobs — VPK",
		description: "Local scheduling and run management surface.",
	},
};

export default function RovoAppJobsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
