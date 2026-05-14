import type { Metadata } from "next";
import { RovoAppQueueProvider } from "@/app/rovo-app/rovo-app-queue-provider";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("rovo"),
	description: "Rovo interface",
	openGraph: {
		title: `${getProjectPageTitle("rovo")} — VPK`,
		description: "Rovo interface",
	},
};

export default function RovoAppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RovoAppQueueProvider>{children}</RovoAppQueueProvider>
	);
}
