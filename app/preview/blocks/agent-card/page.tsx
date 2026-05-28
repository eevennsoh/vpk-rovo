import type { Metadata } from "next";
import AgentCardPage from "@/components/blocks/agent-card/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("agent-card", "blocks"),
};

export default function AgentCardPreviewPage() {
	return <AgentCardPage />;
}
