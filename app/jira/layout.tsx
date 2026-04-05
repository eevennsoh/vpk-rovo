import type { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("jira"),
	description: "Jira board view",
	openGraph: {
		title: `${getProjectPageTitle("jira")} — VPK`,
		description: "Jira board view",
	},
};

export default function JiraLayout({ children }: { children: React.ReactNode }) {
	return children;
}
