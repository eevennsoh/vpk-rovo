import type { Metadata } from "next";
import { RovoAppQueueProvider } from "@/app/studio/rovo-queue-provider";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("studio"),
	description: "Studio interface",
	openGraph: {
		title: `${getProjectPageTitle("studio")} — VPK`,
		description: "Studio interface",
	},
};

export default function StudioAppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RovoAppQueueProvider>{children}</RovoAppQueueProvider>
	);
}
