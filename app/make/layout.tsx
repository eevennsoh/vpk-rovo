import type { Metadata } from "next";
import { CreationModeProvider } from "@/app/contexts/context-creation-mode";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("make"),
	openGraph: {
		title: `${getProjectPageTitle("make")} — VPK`,
	},
};

export default function MakeLayout({ children }: { children: React.ReactNode }) {
	return <CreationModeProvider>{children}</CreationModeProvider>;
}
