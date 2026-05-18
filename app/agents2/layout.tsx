import type { Metadata } from "next";
import { getProjectPageTitle } from "@/lib/project-page-title";

const title = getProjectPageTitle("agents2");
const description = "Agents2 interface";

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title: `${title} — VPK`,
		description,
	},
};

export default function Agents2Layout({ children }: { children: React.ReactNode }) {
	return children;
}
