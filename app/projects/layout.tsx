import type { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("projects"),
	description: "Task and project management with Jira analytics",
	openGraph: {
		title: `${getProjectPageTitle("projects")} — VPK`,
		description: "Task and project management with Jira analytics",
	},
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
