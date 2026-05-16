import type { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

const title = getProjectPageTitle("agents");
const description = "Agents interface";

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title: `${title} — VPK`,
		description,
	},
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
	return children;
}
