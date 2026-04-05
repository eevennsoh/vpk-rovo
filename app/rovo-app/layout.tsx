import type { Metadata } from "next";
import { RovoAppQueueProvider } from "@/app/rovo-app/rovo-app-queue-provider";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("rovo-app"),
	description: "Rovo App interface",
	openGraph: {
		title: `${getProjectPageTitle("rovo-app")} — VPK`,
		description: "Rovo App interface",
	},
};

export default function RovoAppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RovoAppQueueProvider>{children}</RovoAppQueueProvider>
	);
}
